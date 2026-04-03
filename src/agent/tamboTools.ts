/**
 * Tambo agent tools and context helpers for Trip Planner.
 * Tools are created via factory functions so they close over current plan state
 * (planId, currentPlan, loadPlan, mapBounds) from PlanEditor.
 */

import { defineTool } from '@tambo-ai/react';
import { z } from 'zod';
import { searchLocations, type SearchViewbox } from '../services/geocoding';
import {
  createLocation,
  createDay,
  createTransport,
} from '../services/firebase/firestore';
import { calculateRoute, formatDuration } from '../services/routing';
import type { TripPlan } from '../types';
import type { LocationCategory, TravelType } from '../types';

const LOCATION_CATEGORIES: LocationCategory[] = [
  'city', 'attraction', 'restaurant', 'hotel', 'park', 'museum',
  'beach', 'mountain', 'viewpoint', 'other',
];
const TRAVEL_TYPES: TravelType[] = ['car', 'walking', 'public-transport', 'bike'];

export interface TamboAgentDeps {
  planId: string | undefined;
  currentPlan: TripPlan | null;
  loadPlan: (planId: string, forceReload?: boolean) => Promise<void>;
  mapBounds: { south: number; west: number; north: number; east: number } | null;
  refreshPlanCover: (planId: string) => Promise<unknown>;
}

/**
 * Build context helper for current plan summary. Call this in PlanEditor with
 * currentPlan and mapBounds so the agent receives plan context on every message.
 */
export function buildPlanSummaryContextHelper(deps: TamboAgentDeps) {
  return function current_plan_summary() {
    const { planId, currentPlan, mapBounds } = deps;
    if (!planId || planId === 'new' || !currentPlan) {
      return {
        hasPlan: false,
        message: 'No trip plan is open. Open or create a plan first to add locations or get suggestions.',
      };
    }
    const days = (currentPlan.days || []).map((day) => ({
      dayNumber: day.dayNumber,
      dayId: day.id,
      locationNames: (day.locations || []).map((loc) => loc.name),
      locationIds: (day.locations || []).map((loc) => ({ id: loc.id, name: loc.name })),
    }));
    return {
      hasPlan: true,
      planId,
      title: currentPlan.title,
      description: currentPlan.description,
      daysCount: days.length,
      days,
      mapBounds: mapBounds
        ? { south: mapBounds.south, west: mapBounds.west, north: mapBounds.north, east: mapBounds.east }
        : undefined,
    };
  };
}

/**
 * Build Tambo tools that operate on the current plan. Pass deps from PlanEditor.
 */
export function buildTamboTools(deps: TamboAgentDeps) {
  const { planId, currentPlan, loadPlan, mapBounds, refreshPlanCover: doRefreshCover } = deps;

  const getPlanSummaryTool = defineTool({
    name: 'get_plan_summary',
    description: 'Get a summary of the currently open trip plan: title, days, and location names per day. Use this to answer questions about the plan.',
    tool: async () => {
      if (!currentPlan || !planId || planId === 'new') {
        return { error: 'No trip plan is open. Open or create a plan first.' };
      }
      const days = (currentPlan.days || []).map((day) => ({
        dayNumber: day.dayNumber,
        locationNames: (day.locations || []).map((l) => l.name),
      }));
      return {
        planId,
        title: currentPlan.title,
        description: currentPlan.description,
        daysCount: days.length,
        days,
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      planId: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      daysCount: z.number().optional(),
      days: z.array(z.object({ dayNumber: z.number(), locationNames: z.array(z.string()) })).optional(),
      error: z.string().optional(),
    }),
  });

  const searchPlacesTool = defineTool({
    name: 'search_places',
    description: 'Search for places (POI) by query using OpenStreetMap Nominatim. Use this to find attractions, restaurants, or addresses before adding them to the plan. Optionally bias results to the current map area.',
    tool: async ({ query }: { query: string }) => {
      try {
        const viewbox: SearchViewbox | undefined = mapBounds
          ? { south: mapBounds.south, west: mapBounds.west, north: mapBounds.north, east: mapBounds.east }
          : undefined;
        const results = await searchLocations(query.trim(), undefined, viewbox);
        return results.slice(0, 10).map((r) => ({
          place_id: r.place_id,
          name: (r.namedetails?.name || r.display_name?.split(',')[0] || 'Place').trim(),
          display_name: r.display_name ?? '',
          lat: parseFloat(String(r.lat)),
          lon: parseFloat(String(r.lon)),
          type: r.type ?? '',
          category: r.category,
        }));
      } catch (err) {
        console.error('[search_places] OpenStreetMap Nominatim error:', err);
        return [];
      }
    },
    inputSchema: z.object({
      query: z.string().describe('Search query (e.g. "museums in Rome", "Trevi Fountain")'),
    }),
    outputSchema: z.array(
      z.object({
        place_id: z.number(),
        name: z.string(),
        display_name: z.string(),
        lat: z.number(),
        lon: z.number(),
        type: z.string(),
        category: z.string().optional(),
      })
    ),
  });

  const addLocationToPlanTool = defineTool({
    name: 'add_location_to_plan',
    description: 'Add a location to a specific day of the trip plan. Provide day number (1-based), name, and coordinates. Use search_places first to get coordinates, then call this to add the chosen place.',
    tool: async ({
      dayNumber,
      name,
      lat,
      lng,
      description,
      category,
    }: {
      dayNumber: number;
      name: string;
      lat: number;
      lng: number;
      description?: string;
      category?: LocationCategory;
    }) => {
      if (!planId || planId === 'new') {
        return { success: false, error: 'No trip plan is open. Open or create a plan first.' };
      }
      if (!currentPlan?.days?.length) {
        return { success: false, error: 'This plan has no days. Add a day first.' };
      }
      const day = currentPlan.days.find((d) => d.dayNumber === dayNumber);
      if (!day) {
        return {
          success: false,
          error: `Day ${dayNumber} not found. Plan has days 1 to ${currentPlan.days.length}.`,
        };
      }
      const order = (day.locations?.length ?? 0);
      const categoryToUse = category ?? 'other';
      try {
        const locationId = await createLocation(planId, day.id, {
          name: name.trim(),
          category: categoryToUse,
          coordinates: { lat, lng },
          order,
          media: [],
          description: description?.trim() || undefined,
        });
        await loadPlan(planId, true);
        await doRefreshCover(planId);
        return { success: true, locationId, dayNumber, name: name.trim() };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add location';
        return { success: false, error: message };
      }
    },
    inputSchema: z.object({
      dayNumber: z.number().describe('Day number (1-based) to add the location to'),
      name: z.string().describe('Display name of the location'),
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      description: z.string().optional(),
      category: z.enum(LOCATION_CATEGORIES as unknown as [string, ...string[]]).optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      locationId: z.string().optional(),
      dayNumber: z.number().optional(),
      name: z.string().optional(),
      error: z.string().optional(),
    }),
  });

  const addDayTool = defineTool({
    name: 'add_day',
    description: 'Add a new day to the trip plan. The new day will have the next day number.',
    tool: async () => {
      if (!planId || planId === 'new') {
        return { success: false, error: 'No trip plan is open. Open or create a plan first.' };
      }
      const nextDayNumber = (currentPlan?.days?.length ?? 0) + 1;
      try {
        const dayId = await createDay(planId, { dayNumber: nextDayNumber });
        await loadPlan(planId, true);
        return { success: true, dayId, dayNumber: nextDayNumber };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add day';
        return { success: false, error: message };
      }
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      dayId: z.string().optional(),
      dayNumber: z.number().optional(),
      error: z.string().optional(),
    }),
  });

  const addTransportTool = defineTool({
    name: 'add_transport',
    description: 'Add transport between two locations on the same day (e.g. car, walking, public transport). Use location IDs from the plan summary or day structure.',
    tool: async ({
      dayNumber,
      fromLocationId,
      toLocationId,
      type,
      notes,
    }: {
      dayNumber: number;
      fromLocationId: string;
      toLocationId: string;
      type: TravelType;
      notes?: string;
    }) => {
      if (!planId || planId === 'new') {
        return { success: false, error: 'No trip plan is open. Open or create a plan first.' };
      }
      if (!currentPlan?.days?.length) {
        return { success: false, error: 'This plan has no days.' };
      }
      const day = currentPlan.days.find((d) => d.dayNumber === dayNumber);
      if (!day) {
        return {
          success: false,
          error: `Day ${dayNumber} not found. Plan has days 1 to ${currentPlan.days.length}.`,
        };
      }
      const fromLoc = day.locations?.find((l) => l.id === fromLocationId);
      const toLoc = day.locations?.find((l) => l.id === toLocationId);
      if (!fromLoc || !toLoc) {
        return {
          success: false,
          error: 'One or both location IDs not found on this day. Use get_plan_summary to see valid location IDs.',
        };
      }
      try {
        const fromCoords = fromLoc.coordinates;
        const toCoords = toLoc.coordinates;
        const routeResult = await calculateRoute(fromCoords, toCoords, type);
        const timeStr = formatDuration(routeResult.duration);
        const transportId = await createTransport(planId, day.id, {
          fromLocationId,
          toLocationId,
          type,
          distance: routeResult.distance,
          time: timeStr,
          route: routeResult.route,
          notes: notes?.trim() || undefined,
        });
        await loadPlan(planId, true);
        return {
          success: true,
          transportId,
          dayNumber,
          from: fromLoc.name,
          to: toLoc.name,
          type,
          distance: routeResult.distance,
          time: timeStr,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add transport';
        return { success: false, error: message };
      }
    },
    inputSchema: z.object({
      dayNumber: z.number().describe('Day number (1-based)'),
      fromLocationId: z.string().describe('ID of the starting location'),
      toLocationId: z.string().describe('ID of the destination location'),
      type: z.enum(TRAVEL_TYPES as unknown as [string, ...string[]]).describe('Mode of transport'),
      notes: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      transportId: z.string().optional(),
      dayNumber: z.number().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.string().optional(),
      distance: z.number().optional(),
      time: z.string().optional(),
      error: z.string().optional(),
    }),
  });

  return [
    getPlanSummaryTool,
    searchPlacesTool,
    addLocationToPlanTool,
    addDayTool,
    addTransportTool,
  ];
}
