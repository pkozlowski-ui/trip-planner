import { LocationCategory } from '../types';
import {
  Location as LocationIcon,
  Restaurant,
  Hotel,
  Tree,
  Building,
  Cloudy,
  Mountain,
  View,
  CircleFilled,
} from '@carbon/icons-react';

/**
 * Get icon component for a location category
 */
export function getCategoryIcon(category: LocationCategory) {
  switch (category) {
    case 'city':
      return LocationIcon;
    case 'attraction':
      return LocationIcon;
    case 'restaurant':
      return Restaurant;
    case 'hotel':
      return Hotel;
    case 'park':
      return Tree;
    case 'museum':
      return Building;
    case 'beach':
      return Cloudy;
    case 'mountain':
      return Mountain;
    case 'viewpoint':
      return View;
    case 'other':
    default:
      return CircleFilled;
  }
}

/**
 * Get icon name for a location category (for display)
 */
export function getCategoryIconName(category: LocationCategory): string {
  switch (category) {
    case 'city':
      return 'Location';
    case 'attraction':
      return 'Location';
    case 'restaurant':
      return 'Restaurant';
    case 'hotel':
      return 'Hotel';
    case 'park':
      return 'Tree';
    case 'museum':
      return 'Museum';
    case 'beach':
      return 'Beach';
    case 'mountain':
      return 'Mountain';
    case 'viewpoint':
      return 'View';
    case 'other':
    default:
      return 'CircleFilled';
  }
}
