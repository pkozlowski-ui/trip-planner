/**
 * TypeScript type definitions for Trip Planner application
 */

/**
 * Travel type for route between locations
 */
export type TravelType = 'car' | 'walking' | 'public-transport' | 'bike';

/**
 * Media item type
 */
export type MediaType = 'image' | 'youtube' | 'link' | 'google-photos';

/**
 * Map style type
 */
export type MapStyle = 'minimal' | 'minimal-no-labels' | 'toner-lite' | 'osm';

/**
 * Location category
 */
export type LocationCategory =
  | 'city'
  | 'attraction'
  | 'restaurant'
  | 'hotel'
  | 'park'
  | 'museum'
  | 'beach'
  | 'mountain'
  | 'viewpoint'
  | 'other';

/**
 * Coordinates for a location on the map
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Transport between two locations (optional)
 */
export interface Transport {
  id: string;
  fromLocationId: string; // ID of the location this transport starts from
  toLocationId: string; // ID of the location this transport goes to
  type: TravelType;
  distance?: number; // in kilometers (estimated or calculated)
  time?: string; // e.g., "2h 49m" (estimated or calculated)
  route?: Coordinates[]; // Optional route polyline points
  notes?: string; // Optional notes about this transport
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Travel information to next location (deprecated - use Transport instead)
 * @deprecated Use Transport interface instead
 */
export interface TravelInfo {
  type: TravelType;
  distance: number; // in kilometers
  time: string; // e.g., "2h 49m"
  route?: Coordinates[]; // Optional route polyline points
}

/**
 * Media item attached to a location
 */
export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string; // For images and videos
  title?: string; // For links and videos
  description?: string; // Optional description
  createdAt: Date;
}

/**
 * Attribution for images from Wikimedia Commons (required by CC licenses)
 */
export interface ImageAttribution {
  author?: string;
  license?: string;
  sourceUrl?: string;
}

/**
 * Location/Point of Interest (POI)
 */
export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  coordinates: Coordinates;
  description?: string;
  image?: string; // Main image URL
  imageAttribution?: ImageAttribution; // For Commons images
  website?: string; // Official website (e.g. from Wikidata P856)
  wikipediaUrl?: string; // Link to Wikipedia article (for marker popup)
  wikidataId?: string; // e.g. "Q123" for optional re-enrichment
  duration?: string; // e.g., "3h", "2h 30m"
  openingHours?: string; // e.g., "7:00-21:00"
  rating?: number; // e.g., 4.9 (out of 5)
  order: number; // Order within the day
  media: MediaItem[]; // Attached media items
  notes?: string; // User notes for this location
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Day in a trip plan
 */
export interface Day {
  id: string;
  dayNumber: number;
  date?: Date; // Optional specific date
  locations: Location[];
  transports: Transport[]; // Transport between locations (optional)
  notes?: string; // Day-level notes
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trip Plan
 */
export interface TripPlan {
  id: string;
  userId: string; // Firebase user ID
  title: string;
  description?: string;
  startDate?: Date; // Optional start date
  endDate?: Date; // Optional end date
  days: Day[];
  // Computed properties (can be calculated from days)
  totalDays: number;
  totalPoints: number; // Total number of locations
  totalDistance: number; // Total distance in kilometers
  mapStyle?: MapStyle; // Preferred map style
  isPublic: boolean; // Whether plan is publicly shareable
  shareToken?: string; // Token for public sharing
  coverImage?: string; // URL for dashboard tile (from best location image)
  coverImageAttribution?: ImageAttribution; // For Commons cover image
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile (extends Firebase User)
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore document reference types
 */
export interface TripPlanDocument extends Omit<TripPlan, 'days'> {
  // Days stored as subcollection
}

export interface DayDocument extends Omit<Day, 'locations' | 'transports'> {
  planId: string; // Reference to parent TripPlan
  // Locations stored as subcollection
  // Transports stored as subcollection
}

export interface LocationDocument extends Location {
  planId: string; // Reference to parent TripPlan
  dayId: string; // Reference to parent Day
}


