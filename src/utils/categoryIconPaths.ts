import { LocationCategory } from '../types';

/**
 * Get SVG path data for category icons (for use in HTML markers)
 * These are simplified versions of Carbon Design System icons
 */
export function getCategoryIconPath(category: LocationCategory): string {
  switch (category) {
    case 'city':
    case 'attraction':
      // Location pin icon
      return 'M8 1C5.2 1 3 3.2 3 6c0 4.4 5 9 5 9s5-4.6 5-9c0-2.8-2.2-5-5-5zm0 7.5c-1.4 0-2.5-1.1-2.5-2.5S6.6 3.5 8 3.5s2.5 1.1 2.5 2.5S9.4 8.5 8 8.5z';
    
    case 'restaurant':
      // Fork and knife icon
      return 'M8 1v6h1v8h1V7h1V1H8zm4 0v6h1v8h1V7h1V1h-3z';
    
    case 'hotel':
      // Building icon
      return 'M1 15h14v-1H1v1zm0-14v12h14V1H1zm1 1h12v10H2V2zm1 2v1h2V4H3zm0 2v1h2V6H3zm0 2v1h2V8H3zm4-4v1h2V4H7zm0 2v1h2V6H7zm0 2v1h2V8H7zm4-4v1h2V4h-2zm0 2v1h2V6h-2zm0 2v1h2V8h-2z';
    
    case 'park':
      // Tree icon
      return 'M8 1l2 3h-1v3h2v2h-2v4H7v-4H5V7h2V4H6l2-3z';
    
    case 'museum':
      // Building icon (museum)
      return 'M1 15h14v-1H1v1zm0-14v12h14V1H1zm1 1h12v10H2V2zm1 2v1h2V4H3zm0 2v1h2V6H3zm0 2v1h2V8H3zm4-4v1h2V4H7zm0 2v1h2V6H7zm0 2v1h2V8H7zm4-4v1h2V4h-2zm0 2v1h2V6h-2zm0 2v1h2V8h-2z';
    
    case 'beach':
      // Cloud icon
      return 'M11.5 5c-1.1 0-2 .9-2 2h-1c0-1.7 1.3-3 3-3s3 1.3 3 3h-1c0-1.1-.9-2-2-2zm-3 3c-1.1 0-2 .9-2 2h-1c0-1.7 1.3-3 3-3s3 1.3 3 3h-1c0-1.1-.9-2-2-2zm-3 3c-1.1 0-2 .9-2 2h-1c0-1.7 1.3-3 3-3s3 1.3 3 3h-1c0-1.1-.9-2-2-2z';
    
    case 'mountain':
      // Mountain icon
      return 'M8 1L3 15h10L8 1zm0 3.5L11 13H5l3-8.5z';
    
    case 'viewpoint':
      // View/Eye icon
      return 'M8 4C4 4 1 8 1 8s3 4 7 4 7-4 7-4-3-4-7-4zm0 6.5c-1.4 0-2.5-1.1-2.5-2.5S6.6 5.5 8 5.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zm0-4c-0.8 0-1.5 0.7-1.5 1.5s0.7 1.5 1.5 1.5 1.5-0.7 1.5-1.5-0.7-1.5-1.5-1.5z';
    
    case 'other':
    default:
      // Circle icon
      return 'M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z';
  }
}
