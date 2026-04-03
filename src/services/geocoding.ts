/**
 * Geocoding service using OpenStreetMap Nominatim API
 * Free, no API key required
 */

export interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  category?: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    building?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    [key: string]: string | undefined;
  };
  // Extended data from extratags parameter
  extratags?: {
    opening_hours?: string;
    website?: string;
    phone?: string;
    cuisine?: string;
    wikidata?: string;
    wikipedia?: string;
    brand?: string;
    description?: string;
    image?: string;
    email?: string;
    [key: string]: string | undefined;
  };
  // Alternative names from namedetails parameter
  namedetails?: {
    name?: string;
    'name:en'?: string;
    'name:pl'?: string;
    official_name?: string;
    alt_name?: string;
    [key: string]: string | undefined;
  };
}

// Simple in-memory cache for search results
const searchCache = new Map<string, { results: GeocodingResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Viewbox for geographic biasing
export interface SearchViewbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Search for locations using Nominatim geocoding API
 * Optimized with caching and request cancellation
 * @param query - Search query
 * @param signal - AbortSignal for request cancellation
 * @param viewbox - Optional viewbox to prioritize results from a specific area
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal,
  viewbox?: SearchViewbox
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Include viewbox in cache key for location-aware caching
  const viewboxKey = viewbox ? `_${viewbox.south.toFixed(2)}_${viewbox.west.toFixed(2)}` : '';
  const normalizedQuery = query.trim().toLowerCase() + viewboxKey;

  // Check cache first
  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bb239023-cde3-46c7-be09-5a71c6644f5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fc8e9'},body:JSON.stringify({sessionId:'0fc8e9',location:'geocoding.ts:searchLocations:beforeFetch',message:'Before Nominatim fetch',data:{query:query.trim()},hypothesisId:'H3',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // Use Nominatim API with optimized parameters
    // In dev we use Vite proxy (same-origin) to avoid CORS/preflight; in production we call Nominatim directly (may require a backend proxy if CORS blocks).
    const baseUrl = import.meta.env.DEV ? '/api/nominatim' : 'https://nominatim.openstreetmap.org';
    let path = `/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&extratags=1&namedetails=1&dedupe=1`;
    if (viewbox) {
      path += `&viewbox=${viewbox.west},${viewbox.north},${viewbox.east},${viewbox.south}&bounded=0`;
    }
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      signal, // Support request cancellation
      // No custom headers: browser request with User-Agent triggers CORS preflight; Nominatim can block. Dev uses Vite proxy; prod uses simple request (Nominatim may accept).
    });

    if (signal?.aborted) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bb239023-cde3-46c7-be09-5a71c6644f5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fc8e9'},body:JSON.stringify({sessionId:'0fc8e9',location:'geocoding.ts:searchLocations:afterFetch',message:'Nominatim response',data:{count:Array.isArray(data)?data.length:-1,ok:response.ok},hypothesisId:'H3',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!Array.isArray(data)) {
      console.warn('Nominatim returned non-array:', typeof data);
      return [];
    }
    const results = data.map((item: any) => ({
      place_id: item.place_id,
      display_name: item.display_name ?? '',
      lat: item.lat,
      lon: item.lon,
      type: item.type ?? '',
      category: item.category,
      importance: item.importance,
      address: item.address || {},
      extratags: item.extratags || {},
      namedetails: item.namedetails || {},
    }));

    // Cache results
    searchCache.set(normalizedQuery, {
      results,
      timestamp: Date.now(),
    });

    // Clean old cache entries (keep only last 50)
    if (searchCache.size > 50) {
      const entries = Array.from(searchCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      searchCache.clear();
      entries.slice(0, 50).forEach(([key, value]) => {
        searchCache.set(key, value);
      });
    }

    return results;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bb239023-cde3-46c7-be09-5a71c6644f5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fc8e9'},body:JSON.stringify({sessionId:'0fc8e9',location:'geocoding.ts:searchLocations:catch',message:'Geocoding error',data:{errorName:error?.name,errorMessage:error?.message},hypothesisId:'H3',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Error searching locations:', error);
    throw error;
  }
}

/**
 * Reverse geocoding - get location details from coordinates
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    // Include extratags and namedetails for rich location data
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&extratags=1&namedetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TripPlanner/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      place_id: data.place_id,
      display_name: data.display_name,
      lat: data.lat,
      lon: data.lon,
      type: data.type || '',
      category: data.category,
      importance: data.importance,
      address: data.address || {},
      extratags: data.extratags || {},
      namedetails: data.namedetails || {},
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

// Helper to get display-friendly category name
export function getCategoryDisplayName(category?: string, type?: string): string {
  const categoryMap: Record<string, string> = {
    // Tourism
    'museum': 'Museum',
    'attraction': 'Attraction',
    'artwork': 'Artwork',
    'viewpoint': 'Viewpoint',
    'gallery': 'Gallery',
    'theme_park': 'Theme Park',
    'zoo': 'Zoo',
    'aquarium': 'Aquarium',
    
    // Amenity
    'restaurant': 'Restaurant',
    'cafe': 'Café',
    'bar': 'Bar',
    'pub': 'Pub',
    'fast_food': 'Fast Food',
    'food_court': 'Food Court',
    'ice_cream': 'Ice Cream',
    'biergarten': 'Beer Garden',
    
    // Accommodation
    'hotel': 'Hotel',
    'hostel': 'Hostel',
    'guest_house': 'Guest House',
    'motel': 'Motel',
    'apartment': 'Apartment',
    
    // Transport
    'bus_station': 'Bus Station',
    'train_station': 'Train Station',
    'airport': 'Airport',
    'ferry_terminal': 'Ferry Terminal',
    'subway_entrance': 'Metro',
    
    // Shopping
    'marketplace': 'Market',
    'supermarket': 'Supermarket',
    'mall': 'Shopping Mall',
    'department_store': 'Department Store',
    
    // Religious
    'place_of_worship': 'Place of Worship',
    'church': 'Church',
    'cathedral': 'Cathedral',
    'mosque': 'Mosque',
    'synagogue': 'Synagogue',
    'temple': 'Temple',
    
    // Nature
    'park': 'Park',
    'garden': 'Garden',
    'nature_reserve': 'Nature Reserve',
    'beach': 'Beach',
    
    // Other
    'cinema': 'Cinema',
    'theatre': 'Theatre',
    'nightclub': 'Nightclub',
    'casino': 'Casino',
    'library': 'Library',
    'university': 'University',
    'hospital': 'Hospital',
    'pharmacy': 'Pharmacy',
  };
  
  return categoryMap[type || ''] || categoryMap[category || ''] || type || category || 'Place';
}

// Helper to get category icon name for Carbon icons
export function getCategoryIconName(category?: string, type?: string): string {
  const iconMap: Record<string, string> = {
    // Tourism
    'museum': 'Building',
    'attraction': 'Star',
    'artwork': 'ColorPalette',
    'viewpoint': 'View',
    'gallery': 'Image',
    'theme_park': 'GameConsole',
    'zoo': 'Bee',
    
    // Food & Drink
    'restaurant': 'Restaurant',
    'cafe': 'Cafe',
    'bar': 'Drink',
    'pub': 'Drink',
    'fast_food': 'Restaurant',
    
    // Accommodation
    'hotel': 'Hotel',
    'hostel': 'Hotel',
    'guest_house': 'Home',
    
    // Transport
    'bus_station': 'Bus',
    'train_station': 'Train',
    'airport': 'Airplane',
    'ferry_terminal': 'Sailboat',
    'subway_entrance': 'TrainSpeed',
    
    // Shopping
    'marketplace': 'ShoppingCart',
    'supermarket': 'ShoppingCart',
    'mall': 'Store',
    
    // Religious
    'place_of_worship': 'Building',
    'church': 'Building',
    'cathedral': 'Building',
    
    // Nature
    'park': 'Tree',
    'garden': 'Sprout',
    'beach': 'Beach',
    
    // Other
    'cinema': 'Video',
    'theatre': 'Theater',
    'library': 'Book',
    'university': 'Education',
    'hospital': 'Hospital',
  };
  
  return iconMap[type || ''] || iconMap[category || ''] || 'Location';
}
