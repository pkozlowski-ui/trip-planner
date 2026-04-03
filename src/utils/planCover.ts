/**
 * Pick best cover image for a trip plan tile (e.g. dashboard).
 * Prefers locations with wikidataId (more notable), then plan order.
 */

import type { ImageAttribution, Location, TripPlan } from '../types';

export interface PlanCoverResult {
  url: string;
  attribution?: ImageAttribution;
}

/**
 * From all locations that have an image, pick the "best" one:
 * - Prefer locations with wikidataId (more notable).
 * - Within same group, use plan order (day 1 → N, location order within day).
 * Returns null if no location has an image.
 */
export function pickCoverImageFromPlan(plan: TripPlan): PlanCoverResult | null {
  const withImage: { location: Location; dayNumber: number }[] = [];
  for (const day of plan.days) {
    for (const loc of day.locations) {
      if (loc.image?.trim()) {
        withImage.push({ location: loc, dayNumber: day.dayNumber });
      }
    }
  }
  if (withImage.length === 0) return null;

  withImage.sort((a, b) => {
    const aHasWiki = a.location.wikidataId?.trim() ? 1 : 0;
    const bHasWiki = b.location.wikidataId?.trim() ? 1 : 0;
    if (bHasWiki !== aHasWiki) return bHasWiki - aHasWiki; // wikidataId first
    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
    return a.location.order - b.location.order;
  });

  const first = withImage[0].location;
  return {
    url: first.image!,
    attribution: first.imageAttribution,
  };
}
