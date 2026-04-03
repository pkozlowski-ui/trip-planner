/**
 * Overpass API service for querying OpenStreetMap POIs by tags
 * Optimized for city break planning: attractions, historic sites, restaurants, cafes
 */

import { GeocodingResult, SearchViewbox } from './geocoding';

export interface OverpassPOI {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'name:en'?: string;
    tourism?: string;
    historic?: string;
    amenity?: string;
    cuisine?: string;
    opening_hours?: string;
    website?: string;
    phone?: string;
    wikipedia?: string;
    wikidata?: string;
    description?: string;
    image?: string;
    stars?: string;
    [key: string]: string | undefined;
  };
}

export type POICategory = 
  | 'attractions' 
  | 'historic' 
  | 'restaurants' 
  | 'cafes' 
  | 'viewpoints'
  | 'hotels';

// Overpass API endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Cache for Overpass results
const overpassCache = new Map<string, { results: OverpassPOI[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Overpass QL query templates for each category
const CATEGORY_QUERIES: Record<POICategory, string> = {
  attractions: `
    node["tourism"~"attraction|museum|artwork|gallery|zoo|aquarium|theme_park"]({{bbox}});
    way["tourism"~"attraction|museum|artwork|gallery|zoo|aquarium|theme_park"]({{bbox}});
  `,
  historic: `
    node["historic"]({{bbox}});
    way["historic"]({{bbox}});
  `,
  restaurants: `
    node["amenity"="restaurant"]({{bbox}});
    way["amenity"="restaurant"]({{bbox}});
  `,
  cafes: `
    node["amenity"="cafe"]({{bbox}});
    way["amenity"="cafe"]({{bbox}});
  `,
  viewpoints: `
    node["tourism"="viewpoint"]({{bbox}});
  `,
  hotels: `
    node["tourism"~"hotel|hostel|guest_house|motel"]({{bbox}});
    way["tourism"~"hotel|hostel|guest_house|motel"]({{bbox}});
  `,
};

/**
 * Build Overpass QL query for a category within bounds
 */
function buildQuery(category: POICategory, bounds: SearchViewbox): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const categoryQuery = CATEGORY_QUERIES[category].replace(/\{\{bbox\}\}/g, bbox);
  
  return `
    [out:json][timeout:15];
    (
      ${categoryQuery}
    );
    out center tags qt 50;
  `.trim();
}

/**
 * Parse Overpass API response into POI objects
 */
function parseOverpassResponse(data: any): OverpassPOI[] {
  if (!data.elements || !Array.isArray(data.elements)) {
    return [];
  }

  return data.elements
    .filter((el: any) => el.tags?.name) // Only include named POIs
    .map((el: any) => {
      // For ways/relations, use the center point
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      
      if (!lat || !lon) return null;

      return {
        id: el.id,
        type: el.type,
        lat,
        lon,
        tags: el.tags || {},
      };
    })
    .filter(Boolean) as OverpassPOI[];
}

/**
 * Search for POIs by category within a bounding box
 */
export async function searchByCategory(
  category: POICategory,
  bounds: SearchViewbox,
  signal?: AbortSignal
): Promise<OverpassPOI[]> {
  // Create cache key
  const cacheKey = `${category}_${bounds.south.toFixed(3)}_${bounds.west.toFixed(3)}_${bounds.north.toFixed(3)}_${bounds.east.toFixed(3)}`;
  
  // Check cache
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  const query = buildQuery(category, bounds);

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const results = parseOverpassResponse(data);

    // Cache results
    overpassCache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (overpassCache.size > 30) {
      const entries = Array.from(overpassCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      overpassCache.clear();
      entries.slice(0, 30).forEach(([key, value]) => {
        overpassCache.set(key, value);
      });
    }

    return results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Overpass API error:', error);
    throw error;
  }
}

/**
 * Search for POIs near a specific point
 */
export async function searchNearby(
  lat: number,
  lng: number,
  radiusMeters: number = 1000,
  categories: POICategory[] = ['attractions', 'historic'],
  signal?: AbortSignal
): Promise<OverpassPOI[]> {
  const categoryQueries = categories.map(cat => {
    const template = CATEGORY_QUERIES[cat];
    return template.replace(/\({{bbox}}\)/g, `(around:${radiusMeters},${lat},${lng})`);
  }).join('\n');

  const query = `
    [out:json][timeout:15];
    (
      ${categoryQueries}
    );
    out center tags qt 30;
  `.trim();

  const cacheKey = `nearby_${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusMeters}_${categories.join('_')}`;
  
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const results = parseOverpassResponse(data);

    overpassCache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    return results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Overpass API error:', error);
    throw error;
  }
}

/**
 * Convert Overpass POI to GeocodingResult format for unified display
 */
export function convertToGeocodingResult(poi: OverpassPOI): GeocodingResult {
  const tags = poi.tags;
  
  // Determine category and type from tags
  let category = 'place';
  let type = 'place';
  
  if (tags.tourism) {
    category = 'tourism';
    type = tags.tourism;
  } else if (tags.historic) {
    category = 'historic';
    type = tags.historic;
  } else if (tags.amenity) {
    category = 'amenity';
    type = tags.amenity;
  }

  // Build display name
  const name = tags['name:en'] || tags.name || 'Unknown';
  
  return {
    place_id: poi.id,
    display_name: name,
    lat: String(poi.lat),
    lon: String(poi.lon),
    type,
    category,
    importance: 0.5,
    address: {},
    extratags: {
      opening_hours: tags.opening_hours,
      website: tags.website,
      phone: tags.phone,
      cuisine: tags.cuisine,
      wikipedia: tags.wikipedia,
      wikidata: tags.wikidata,
      description: tags.description,
      image: tags.image,
      stars: tags.stars,
      historic: tags.historic,
    },
    namedetails: {
      name: tags.name,
      'name:en': tags['name:en'],
    },
  };
}

/**
 * Get human-readable cuisine name
 */
export function formatCuisine(cuisine?: string): string {
  if (!cuisine) return '';
  
  // Handle multiple cuisines separated by semicolon
  const cuisines = cuisine.split(';').map(c => c.trim());
  
  const cuisineMap: Record<string, string> = {
    italian: 'Italian',
    chinese: 'Chinese',
    japanese: 'Japanese',
    indian: 'Indian',
    mexican: 'Mexican',
    thai: 'Thai',
    french: 'French',
    spanish: 'Spanish',
    greek: 'Greek',
    turkish: 'Turkish',
    vietnamese: 'Vietnamese',
    korean: 'Korean',
    american: 'American',
    british: 'British',
    polish: 'Polish',
    german: 'German',
    mediterranean: 'Mediterranean',
    asian: 'Asian',
    european: 'European',
    international: 'International',
    pizza: 'Pizza',
    burger: 'Burgers',
    sushi: 'Sushi',
    seafood: 'Seafood',
    steak: 'Steakhouse',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    regional: 'Regional',
    local: 'Local',
    coffee_shop: 'Coffee',
    ice_cream: 'Ice Cream',
    breakfast: 'Breakfast',
    brunch: 'Brunch',
  };

  return cuisines
    .map(c => cuisineMap[c.toLowerCase()] || c.charAt(0).toUpperCase() + c.slice(1))
    .slice(0, 2) // Max 2 cuisines
    .join(', ');
}

/**
 * Get human-readable historic type
 */
export function formatHistoricType(historic?: string): string {
  if (!historic) return '';
  
  const historicMap: Record<string, string> = {
    castle: 'Castle',
    monument: 'Monument',
    memorial: 'Memorial',
    ruins: 'Ruins',
    archaeological_site: 'Archaeological Site',
    church: 'Historic Church',
    cathedral: 'Cathedral',
    palace: 'Palace',
    fort: 'Fort',
    tower: 'Tower',
    city_gate: 'City Gate',
    manor: 'Manor House',
    monastery: 'Monastery',
    battlefield: 'Battlefield',
    tomb: 'Tomb',
    building: 'Historic Building',
    ship: 'Historic Ship',
    aircraft: 'Historic Aircraft',
    locomotive: 'Historic Train',
    wayside_cross: 'Wayside Cross',
    wayside_shrine: 'Wayside Shrine',
    boundary_stone: 'Boundary Stone',
    milestone: 'Milestone',
  };

  return historicMap[historic.toLowerCase()] || historic.charAt(0).toUpperCase() + historic.slice(1);
}

/**
 * Get Wikipedia URL from tag
 */
export function getWikipediaUrl(wikipedia?: string): string | null {
  if (!wikipedia) return null;
  
  // Format: "en:Article Name" or just "Article Name"
  const match = wikipedia.match(/^([a-z]{2}):(.+)$/);
  if (match) {
    const [, lang, article] = match;
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(article.replace(/ /g, '_'))}`;
  }
  
  // Default to English Wikipedia
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipedia.replace(/ /g, '_'))}`;
}
