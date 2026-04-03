import { TravelType } from '../types';
import { Car, Pedestrian, Train, CircleFilled } from '@carbon/icons-react';

/**
 * Get icon component for transport type
 */
export function getTransportIcon(travelType: TravelType) {
  switch (travelType) {
    case 'car':
      return Car;
    case 'walking':
      return Pedestrian;
    case 'public-transport':
      return Train;
    case 'bike':
      return CircleFilled; // Bike icon not available, using CircleFilled as fallback
    default:
      return Pedestrian;
  }
}

/**
 * Get SVG path for transport icon (for use in HTML markers)
 */
export function getTransportIconPath(travelType: TravelType): string {
  switch (travelType) {
    case 'car':
      // Car icon path
      return 'M3 10h10v2H3v-2zm1-2h8v1H4V8zm-1 5h10v1H3v-1z';
    case 'walking':
      // Person walking icon path
      return 'M8 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-2 4v6h1v6h2v-6h1V5H6z';
    case 'public-transport':
      // Train icon path
      return 'M2 4h12v8H2V4zm1 1v6h10V5H3zm2 5h6v1H5v-1z';
    case 'bike':
      // Bike icon path
      return 'M8 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 6h2v4H4V8zm8 0h2v4h-2V8z';
    default:
      return 'M8 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-2 4v6h1v6h2v-6h1V5H6z';
  }
}
