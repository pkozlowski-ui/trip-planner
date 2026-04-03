/**
 * Routing service for calculating distance and time between two coordinates
 * Uses OpenRouteService API (free tier available)
 */

import { Coordinates, TravelType } from '../types';

interface RouteResult {
  distance: number; // in kilometers
  duration: number; // in seconds
  route?: Coordinates[]; // Route polyline points
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) *
    Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time based on distance and travel type
 * Returns time in seconds
 */
function estimateTime(distanceKm: number, travelType: TravelType): number {
  // Average speeds in km/h
  const speeds: Record<TravelType, number> = {
    car: 50, // Average city speed
    walking: 5, // Average walking speed
    'public-transport': 30, // Average public transport speed
    bike: 15, // Average cycling speed
  };

  const speed = speeds[travelType] || speeds.walking;
  const timeHours = distanceKm / speed;
  return Math.round(timeHours * 3600); // Convert to seconds
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '< 1m';
  }
}

/**
 * Calculate route between two coordinates using OSRM (Open Source Routing Machine)
 * Falls back to simple distance calculation if API fails
 */
export async function calculateRoute(
  from: Coordinates,
  to: Coordinates,
  travelType: TravelType
): Promise<RouteResult> {
  try {
    // Map travel types to OSRM profiles
    const profileMap: Record<TravelType, string> = {
      'car': 'car',
      'walking': 'foot',
      'public-transport': 'car', // Use car as approximation
      'bike': 'bike',
    };
    
    const profile = profileMap[travelType] || 'car';
    
    // Use OSRM public API (demo server)
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('OSRM API request failed');
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // Convert GeoJSON coordinates to our Coordinates format
      // GeoJSON uses [lng, lat] format
      const routePoints: Coordinates[] = route.geometry.coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0],
      }));
      
      // Distance is in meters, convert to kilometers
      const distance = route.distance / 1000;
      
      // Duration is in seconds
      const duration = route.duration;
      
      return {
        distance: Math.round(distance * 10) / 10,
        duration: Math.round(duration),
        route: routePoints,
      };
    }
    
    // Fallback if no route found
    throw new Error('No route found');
    
  } catch (error) {
    console.warn('Error fetching route from OSRM, using straight line:', error);
    // Fallback to simple calculation
    const distance = calculateDistance(from, to);
    const duration = estimateTime(distance, travelType);
    return {
      distance: Math.round(distance * 10) / 10,
      duration,
      route: [from, to],
    };
  }
}

/**
 * Format route result for display
 */
export function formatRouteResult(result: RouteResult): { distance: string; time: string } {
  return {
    distance: `${result.distance.toFixed(1)} km`,
    time: formatDuration(result.duration),
  };
}

// Export formatDuration for use in other files
export { formatDuration };
