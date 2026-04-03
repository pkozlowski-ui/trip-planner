/**
 * Tambo generative components for the chat UI.
 * MiniMap is not shown in chat (locations are visible on the main map when user clicks a place tile).
 */
import { z } from 'zod';
import ChatPlaceTiles from '../components/chat/ChatPlaceTiles';
import type { TamboComponent } from '@tambo-ai/react';

const miniMapPropsSchema = z.object({
  center: z.object({
    lat: z.number().describe('Latitude of map center'),
    lng: z.number().describe('Longitude of map center'),
  }),
  zoom: z.number().min(1).max(18).optional().describe('Zoom level (default 13)'),
  markers: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number().optional(),
        lon: z.number().optional(),
        label: z.string().optional(),
      })
    )
    .optional()
    .describe('Optional list of markers to show on the map'),
});

/** Renders nothing: we do not show embedded maps in chat; locations are shown on the main map when user clicks a place tile. */
const ChatMiniMapHidden: TamboComponent['component'] = () => null;

export const chatMiniMapComponent: TamboComponent = {
  name: 'MiniMap',
  description:
    'A small inline map showing a location or multiple markers. Use when suggesting places, showing search results, or summarizing a day\'s locations. Pass center (lat, lng), optional zoom (1-18), and optional markers array with lat, lng, and optional label.',
  component: ChatMiniMapHidden,
  propsSchema: miniMapPropsSchema,
};

const placeSummarySchema = z.object({
  name: z.string().describe('Place name'),
  display_name: z.string().optional().describe('Short context or address (e.g. "Baroque centerpiece", "Great for fountains")'),
  type: z.string().optional().describe('Type for icon/context: attraction, viewpoint, monument, museum, restaurant, park'),
  category: z.string().optional().describe('Category e.g. tourism, historic'),
  image: z.string().url().optional().describe('Image URL'),
  rating: z.number().min(0).max(5).optional().describe('Rating out of 5'),
  lat: z.number().describe('Latitude'),
  lng: z.number().optional().describe('Longitude'),
  lon: z.number().optional().describe('Longitude (alternative to lng)'),
});

export const chatPlaceTilesComponent: TamboComponent = {
  name: 'PlaceTiles',
  description:
    'Required whenever you recommend or list specific places by name (restaurants, attractions, museums, etc.). Do NOT list venues in plain text only—always call search_places first, then pass the results here. Same tile style for all; use type (e.g. restaurant, attraction) and display_name for context. Props: places array with name, lat, lng (or lon), optional display_name, type, category, image, rating.',
  component: ChatPlaceTiles,
  propsSchema: z.object({
    places: z.array(placeSummarySchema).describe('List of places to show as tiles (from search_places or similar)'),
  }),
};

export const tamboChatComponents: TamboComponent[] = [chatMiniMapComponent, chatPlaceTilesComponent];
