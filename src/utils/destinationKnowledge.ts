/**
 * Destination knowledge base for the Dashboard Wizard plan generation.
 * Each stop contains curated attractions with vibe tags so the generator can
 * place real, specific locations instead of just city-centre pins.
 */

import type { LocationCategory } from '../types';

// ── Vibe tags ─────────────────────────────────────────────────────────────────

/**
 * Internal vibe keys used to tag attractions.
 * These map from the wizard's free-form vibe chips.
 */
export type VibeKey = 'history' | 'food' | 'nature' | 'beach' | 'nightlife' | 'budget';

/** Maps wizard vibe chip labels → internal VibeKeys */
const VIBE_LABEL_MAP: Record<string, VibeKey[]> = {
  'slow & deep':       ['history', 'nature'],
  'move fast':         ['history'],
  'food-obsessed':     ['food'],
  'history & culture': ['history'],
  'nature first':      ['nature'],
  'budget-focused':    ['budget'],
  'beach & chill':     ['beach'],
  'nightlife matters': ['nightlife'],
};

export function mapWizardVibesToKeys(vibes: string[]): VibeKey[] {
  const keys = new Set<VibeKey>();
  for (const vibe of vibes) {
    const mapped = VIBE_LABEL_MAP[vibe.toLowerCase().trim()];
    if (mapped) mapped.forEach((k) => keys.add(k));
  }
  if (keys.size === 0) {
    // No specific vibes — return a broad default
    keys.add('history');
    keys.add('food');
  }
  return Array.from(keys);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Attraction {
  name: string;
  /** Nominatim search query */
  searchQuery: string;
  category: LocationCategory;
  vibes: VibeKey[];
  /** Always include regardless of vibe filter */
  mustSee?: boolean;
}

export interface DestinationStop {
  name: string;
  /** Query string sent to Nominatim for geocoding the city itself */
  searchQuery: string;
  minDays: number;
  idealDays: number;
  /**
   * 1 = must-see (always included)
   * 2 = great addition (included when days ≥ 7)
   * 3 = optional bonus (included when days ≥ 14)
   */
  priority: 1 | 2 | 3;
  attractions: Attraction[];
}

export interface ItineraryStop extends DestinationStop {
  assignedDays: number;
  startDay: number;
}

export interface SelectedAttraction extends Attraction {
  /** 1-based day number within the whole itinerary */
  assignedDay: number;
  /** 0-based order within that day */
  orderInDay: number;
}

// ── Attraction selection ──────────────────────────────────────────────────────

const MAX_PER_DAY = 3;

/**
 * Pick the best attractions for a stop given user vibes and assigned days.
 * Returns attractions already assigned to specific itinerary days.
 */
export function selectAttractionsForStop(
  stop: ItineraryStop,
  userVibes: string[],
): SelectedAttraction[] {
  const vibeKeys = mapWizardVibesToKeys(userVibes);
  const maxTotal = Math.min(stop.assignedDays * MAX_PER_DAY, 10);

  // Score each attraction: must-sees get 100pts, then +1 per matching vibe
  const scored = stop.attractions.map((a) => ({
    ...a,
    score: (a.mustSee ? 100 : 0) + a.vibes.filter((v) => vibeKeys.includes(v)).length,
  }));
  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, maxTotal);

  // Distribute evenly across the stop's assigned days
  const dayCounters: number[] = Array(stop.assignedDays).fill(0);
  return selected.map((a, idx) => {
    // Round-robin across days, respecting MAX_PER_DAY
    const daySlot = idx % stop.assignedDays;
    const orderInDay = dayCounters[daySlot]++;
    return {
      ...a,
      assignedDay: stop.startDay + daySlot,
      orderInDay,
    };
  });
}

// ── Knowledge base ────────────────────────────────────────────────────────────

const DESTINATION_KNOWLEDGE: Record<string, DestinationStop[]> = {
  // ── Colombia ──────────────────────────────────────────────────────────────
  'colombia': [
    {
      name: 'Cartagena',
      searchQuery: 'Cartagena, Colombia',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Ciudad Amurallada (Walled City)', searchQuery: 'Ciudad Amurallada, Cartagena, Colombia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Castillo San Felipe de Barajas', searchQuery: 'Castillo San Felipe de Barajas, Cartagena, Colombia', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Getsemaní Neighborhood', searchQuery: 'Getsemaní, Cartagena, Colombia', category: 'attraction', vibes: ['history', 'nightlife', 'food'] },
        { name: 'Bocagrande Beach', searchQuery: 'Bocagrande, Cartagena, Colombia', category: 'beach', vibes: ['beach'] },
        { name: 'Islas del Rosario', searchQuery: 'Islas del Rosario, Cartagena, Colombia', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Mercado de Bazurto', searchQuery: 'Mercado de Bazurto, Cartagena, Colombia', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Catedral de Cartagena', searchQuery: 'Catedral de Cartagena, Colombia', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Plaza de Bolívar', searchQuery: 'Plaza de Bolívar, Cartagena, Colombia', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Medellín',
      searchQuery: 'Medellin, Colombia',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Plaza Botero & Fernando Botero Sculptures', searchQuery: 'Plaza Botero, Medellin, Colombia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'El Poblado Neighborhood', searchQuery: 'El Poblado, Medellin, Colombia', category: 'attraction', vibes: ['food', 'nightlife'], mustSee: true },
        { name: 'Comuna 13 Street Art Tour', searchQuery: 'Comuna 13, Medellin, Colombia', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Metrocable + Comunas Aerial View', searchQuery: 'Metrocable Medellin, Colombia', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Jardín Botánico de Medellín', searchQuery: 'Jardin Botanico, Medellin, Colombia', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Museo de Antioquia', searchQuery: 'Museo de Antioquia, Medellin, Colombia', category: 'museum', vibes: ['history'] },
        { name: 'Parque Arví (via cable car)', searchQuery: 'Parque Arvi, Medellin, Colombia', category: 'park', vibes: ['nature'] },
        { name: 'Mercado del Río', searchQuery: 'Mercado del Rio, Medellin, Colombia', category: 'restaurant', vibes: ['food', 'nightlife'] },
        { name: 'El Hueco Market District', searchQuery: 'El Hueco, Medellin, Colombia', category: 'attraction', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Bogotá',
      searchQuery: 'Bogota, Colombia',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Museo del Oro (Gold Museum)', searchQuery: 'Museo del Oro, Bogota, Colombia', category: 'museum', vibes: ['history', 'budget'], mustSee: true },
        { name: 'La Candelaria Historic Centre', searchQuery: 'La Candelaria, Bogota, Colombia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Monserrate Hill & Sanctuary', searchQuery: 'Monserrate, Bogota, Colombia', category: 'viewpoint', vibes: ['nature', 'history'] },
        { name: 'Usaquén Village & Market', searchQuery: 'Usaquen, Bogota, Colombia', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Paloquemao Market', searchQuery: 'Paloquemao, Bogota, Colombia', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Museo Nacional de Colombia', searchQuery: 'Museo Nacional de Colombia, Bogota', category: 'museum', vibes: ['history'] },
        { name: 'Zona Rosa & Parque de la 93', searchQuery: 'Zona Rosa, Bogota, Colombia', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Andrés Carne de Res (iconic restaurant)', searchQuery: 'Andres Carne de Res, Chia, Colombia', category: 'restaurant', vibes: ['food', 'nightlife'] },
      ],
    },
    {
      name: 'Coffee Region',
      searchQuery: 'Salento, Quindio, Colombia',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Cocora Valley (wax palms)', searchQuery: 'Valle de Cocora, Salento, Colombia', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Coffee Farm Tour (Finca)', searchQuery: 'coffee farm tour, Salento, Colombia', category: 'attraction', vibes: ['food', 'history'], mustSee: true },
        { name: 'Salento Town Square (El Mirador)', searchQuery: 'Salento, Quindio, Colombia', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Buenavista Village & Coffee Trail', searchQuery: 'Buenavista, Quindio, Colombia', category: 'attraction', vibes: ['nature', 'food'] },
        { name: 'La Truchera (trout farm restaurant)', searchQuery: 'La Truchera, Salento, Colombia', category: 'restaurant', vibes: ['food', 'nature'] },
      ],
    },
    {
      name: 'Santa Marta',
      searchQuery: 'Santa Marta, Colombia',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Tayrona National Park', searchQuery: 'Tayrona National Park, Colombia', category: 'park', vibes: ['nature', 'beach'], mustSee: true },
        { name: 'Minca Cloud Forest', searchQuery: 'Minca, Sierra Nevada, Colombia', category: 'park', vibes: ['nature'] },
        { name: 'El Rodadero Beach', searchQuery: 'El Rodadero, Santa Marta, Colombia', category: 'beach', vibes: ['beach', 'budget'] },
        { name: 'Palomino & Palomino River', searchQuery: 'Palomino, La Guajira, Colombia', category: 'beach', vibes: ['beach', 'nature', 'budget'] },
        { name: 'Quinta de San Pedro Alejandrino', searchQuery: 'Quinta de San Pedro Alejandrino, Santa Marta', category: 'museum', vibes: ['history'] },
      ],
    },
  ],

  // ── Peru ──────────────────────────────────────────────────────────────────
  'peru': [
    {
      name: 'Lima',
      searchQuery: 'Lima, Peru',
      minDays: 1, idealDays: 2, priority: 1,
      attractions: [
        { name: 'Larco Museum (pre-Columbian gold & ceramics)', searchQuery: 'Museo Larco, Lima, Peru', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Miraflores Coastal Cliffs & Park', searchQuery: 'Parque del Amor, Miraflores, Lima, Peru', category: 'viewpoint', vibes: ['nature', 'budget'], mustSee: true },
        { name: 'Barranco Bohemian Neighbourhood', searchQuery: 'Barranco, Lima, Peru', category: 'attraction', vibes: ['food', 'nightlife', 'history'] },
        { name: 'Mercado Surquillo (ceviche & ingredients)', searchQuery: 'Mercado de Surquillo, Lima, Peru', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Plaza Mayor & Lima Cathedral', searchQuery: 'Plaza Mayor, Lima, Peru', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Central or Maido (world-class Peruvian cuisine)', searchQuery: 'Miraflores, Lima, Peru', category: 'restaurant', vibes: ['food'] },
      ],
    },
    {
      name: 'Cusco',
      searchQuery: 'Cusco, Peru',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Sacsayhuamán Inca Fortress', searchQuery: 'Sacsayhuaman, Cusco, Peru', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Qorikancha (Temple of the Sun)', searchQuery: 'Qorikancha, Cusco, Peru', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Plaza de Armas & Cusco Cathedral', searchQuery: 'Plaza de Armas, Cusco, Peru', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'San Pedro Market', searchQuery: 'Mercado San Pedro, Cusco, Peru', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'San Blas Artisan Quarter', searchQuery: 'San Blas, Cusco, Peru', category: 'attraction', vibes: ['history'] },
        { name: 'Chocomuseo or San Pedro chocolate', searchQuery: 'Chocomuseo Cusco, Peru', category: 'attraction', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Machu Picchu',
      searchQuery: 'Machu Picchu, Peru',
      minDays: 1, idealDays: 2, priority: 1,
      attractions: [
        { name: 'Machu Picchu Main Citadel Circuit', searchQuery: 'Machu Picchu citadel, Peru', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Sun Gate (Inti Punku) Hike', searchQuery: 'Inti Punku, Machu Picchu, Peru', category: 'viewpoint', vibes: ['nature', 'history'] },
        { name: 'Aguas Calientes Hot Springs', searchQuery: 'Aguas Calientes, Machu Picchu, Peru', category: 'attraction', vibes: ['nature', 'budget'] },
        { name: 'Huayna Picchu Mountain Hike', searchQuery: 'Huayna Picchu, Machu Picchu, Peru', category: 'mountain', vibes: ['nature'] },
      ],
    },
    {
      name: 'Sacred Valley',
      searchQuery: 'Pisac, Cusco, Peru',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Pisac Inca Ruins & Market', searchQuery: 'Pisac ruins, Cusco, Peru', category: 'attraction', vibes: ['history', 'food', 'budget'], mustSee: true },
        { name: 'Ollantaytambo Fortress', searchQuery: 'Ollantaytambo, Cusco, Peru', category: 'attraction', vibes: ['history'] },
        { name: 'Moray Agricultural Terraces', searchQuery: 'Moray, Maras, Cusco, Peru', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Maras Salt Mines', searchQuery: 'Salineras de Maras, Cusco, Peru', category: 'attraction', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Lake Titicaca',
      searchQuery: 'Puno, Peru',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Uros Floating Islands', searchQuery: 'Uros Islands, Puno, Peru', category: 'attraction', vibes: ['history', 'nature', 'budget'], mustSee: true },
        { name: 'Taquile Island', searchQuery: 'Taquile Island, Lake Titicaca, Peru', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Puno Cathedral & Plaza de Armas', searchQuery: 'Puno Cathedral, Peru', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Arequipa',
      searchQuery: 'Arequipa, Peru',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Monasterio de Santa Catalina', searchQuery: 'Monasterio de Santa Catalina, Arequipa, Peru', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Colca Canyon (condor viewpoint)', searchQuery: 'Cruz del Condor, Colca Canyon, Peru', category: 'park', vibes: ['nature'] },
        { name: 'Plaza de Armas Arequipa', searchQuery: 'Plaza de Armas, Arequipa, Peru', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
  ],

  // ── South America (mix) ───────────────────────────────────────────────────
  'south america': [
    {
      name: 'Cartagena',
      searchQuery: 'Cartagena, Colombia',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Ciudad Amurallada (Walled City)', searchQuery: 'Ciudad Amurallada, Cartagena, Colombia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Castillo San Felipe de Barajas', searchQuery: 'Castillo San Felipe de Barajas, Cartagena', category: 'attraction', vibes: ['history'] },
        { name: 'Getsemaní & street art', searchQuery: 'Getsemaní, Cartagena, Colombia', category: 'attraction', vibes: ['history', 'nightlife'] },
        { name: 'Islas del Rosario', searchQuery: 'Islas del Rosario, Cartagena, Colombia', category: 'beach', vibes: ['beach', 'nature'] },
      ],
    },
    {
      name: 'Medellín',
      searchQuery: 'Medellin, Colombia',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Plaza Botero', searchQuery: 'Plaza Botero, Medellin, Colombia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'El Poblado & Parque Lleras', searchQuery: 'El Poblado, Medellin, Colombia', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Comuna 13 Street Art', searchQuery: 'Comuna 13, Medellin, Colombia', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Jardín Botánico', searchQuery: 'Jardin Botanico, Medellin, Colombia', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Lima',
      searchQuery: 'Lima, Peru',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Museo Larco', searchQuery: 'Museo Larco, Lima, Peru', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Miraflores & Barranco', searchQuery: 'Miraflores, Lima, Peru', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Mercado Surquillo', searchQuery: 'Mercado de Surquillo, Lima, Peru', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Cusco',
      searchQuery: 'Cusco, Peru',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Sacsayhuamán', searchQuery: 'Sacsayhuaman, Cusco, Peru', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Qorikancha', searchQuery: 'Qorikancha, Cusco, Peru', category: 'museum', vibes: ['history'] },
        { name: 'San Pedro Market', searchQuery: 'Mercado San Pedro, Cusco, Peru', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Machu Picchu',
      searchQuery: 'Machu Picchu, Peru',
      minDays: 1, idealDays: 2, priority: 1,
      attractions: [
        { name: 'Machu Picchu Citadel', searchQuery: 'Machu Picchu citadel, Peru', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Sun Gate Hike', searchQuery: 'Inti Punku, Machu Picchu, Peru', category: 'viewpoint', vibes: ['nature'] },
      ],
    },
    {
      name: 'Buenos Aires',
      searchQuery: 'Buenos Aires, Argentina',
      minDays: 2, idealDays: 4, priority: 2,
      attractions: [
        { name: 'La Boca & Caminito', searchQuery: 'Caminito, La Boca, Buenos Aires', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'San Telmo Market', searchQuery: 'San Telmo Market, Buenos Aires', category: 'restaurant', vibes: ['food', 'budget'], mustSee: true },
        { name: 'Recoleta Cemetery', searchQuery: 'Recoleta Cemetery, Buenos Aires', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Palermo Soho & Palermo Hollywood', searchQuery: 'Palermo Soho, Buenos Aires', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Tango show in San Telmo', searchQuery: 'San Telmo, Buenos Aires, Argentina', category: 'attraction', vibes: ['nightlife', 'history'] },
        { name: 'MALBA (Latin American Art Museum)', searchQuery: 'MALBA, Buenos Aires', category: 'museum', vibes: ['history'] },
      ],
    },
    {
      name: 'Patagonia',
      searchQuery: 'El Calafate, Argentina',
      minDays: 2, idealDays: 4, priority: 3,
      attractions: [
        { name: 'Perito Moreno Glacier', searchQuery: 'Perito Moreno Glacier, El Calafate, Argentina', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Torres del Paine (W Trek)', searchQuery: 'Torres del Paine, Chile', category: 'park', vibes: ['nature'] },
        { name: 'Lago Argentino Boat Tour', searchQuery: 'Lago Argentino, El Calafate, Argentina', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'El Chaltén Hiking Trails', searchQuery: 'El Chalten, Patagonia, Argentina', category: 'mountain', vibes: ['nature'] },
      ],
    },
  ],

  // ── Vietnam ───────────────────────────────────────────────────────────────
  'vietnam': [
    {
      name: 'Hanoi',
      searchQuery: 'Hanoi, Vietnam',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Hoan Kiem Lake & Ngoc Son Temple', searchQuery: 'Hoan Kiem Lake, Hanoi, Vietnam', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Old Quarter (36 Streets)', searchQuery: 'Old Quarter, Hanoi, Vietnam', category: 'attraction', vibes: ['history', 'food', 'budget'], mustSee: true },
        { name: 'Ho Chi Minh Mausoleum & One Pillar Pagoda', searchQuery: 'Ho Chi Minh Mausoleum, Hanoi, Vietnam', category: 'attraction', vibes: ['history'] },
        { name: 'Temple of Literature', searchQuery: 'Temple of Literature, Hanoi, Vietnam', category: 'museum', vibes: ['history', 'budget'] },
        { name: 'Bun Bo Nam Bo (street food lane)', searchQuery: 'Bun Bo Nam Bo, Hanoi, Vietnam', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Hoa Lo Prison Museum', searchQuery: 'Hoa Lo Prison, Hanoi, Vietnam', category: 'museum', vibes: ['history'] },
        { name: 'Old Quarter Night Market', searchQuery: 'Old Quarter Night Market, Hanoi, Vietnam', category: 'restaurant', vibes: ['food', 'budget', 'nightlife'] },
      ],
    },
    {
      name: 'Ha Long Bay',
      searchQuery: 'Ha Long Bay, Vietnam',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Ha Long Bay Overnight Cruise', searchQuery: 'Ha Long Bay cruise, Vietnam', category: 'park', vibes: ['nature', 'beach'], mustSee: true },
        { name: 'Sung Sot (Surprise) Cave', searchQuery: 'Sung Sot Cave, Ha Long Bay, Vietnam', category: 'park', vibes: ['nature'] },
        { name: 'Kayaking Around Karst Islands', searchQuery: 'Ha Long Bay kayaking, Vietnam', category: 'park', vibes: ['nature'] },
        { name: 'Fishing Village Visit', searchQuery: 'Vung Vieng fishing village, Ha Long Bay', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Hội An',
      searchQuery: 'Hoi An, Vietnam',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Ancient Town at Lantern Festival', searchQuery: 'Ancient Town, Hoi An, Vietnam', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Japanese Covered Bridge', searchQuery: 'Japanese Bridge, Hoi An, Vietnam', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'An Bang Beach', searchQuery: 'An Bang Beach, Hoi An, Vietnam', category: 'beach', vibes: ['beach'] },
        { name: 'Hoi An Cooking Class', searchQuery: 'cooking class, Hoi An, Vietnam', category: 'attraction', vibes: ['food'] },
        { name: 'Central Market (Chợ Hội An)', searchQuery: 'Hoi An Market, Vietnam', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'My Son Sanctuary Ruins', searchQuery: 'My Son Sanctuary, Quang Nam, Vietnam', category: 'attraction', vibes: ['history'] },
      ],
    },
    {
      name: 'Da Nang',
      searchQuery: 'Da Nang, Vietnam',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'My Khe Beach', searchQuery: 'My Khe Beach, Da Nang, Vietnam', category: 'beach', vibes: ['beach'], mustSee: true },
        { name: 'Marble Mountains', searchQuery: 'Marble Mountains, Da Nang, Vietnam', category: 'park', vibes: ['history', 'nature'] },
        { name: 'Dragon Bridge', searchQuery: 'Dragon Bridge, Da Nang, Vietnam', category: 'viewpoint', vibes: ['budget', 'nightlife'] },
        { name: 'Ba Na Hills & Golden Bridge', searchQuery: 'Ba Na Hills, Da Nang, Vietnam', category: 'viewpoint', vibes: ['nature'] },
      ],
    },
    {
      name: 'Ho Chi Minh City',
      searchQuery: 'Ho Chi Minh City, Vietnam',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'War Remnants Museum', searchQuery: 'War Remnants Museum, Ho Chi Minh City, Vietnam', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Cu Chi Tunnels', searchQuery: 'Cu Chi Tunnels, Ho Chi Minh City, Vietnam', category: 'attraction', vibes: ['history'] },
        { name: 'Ben Thanh Market', searchQuery: 'Ben Thanh Market, Ho Chi Minh City, Vietnam', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Reunification Palace', searchQuery: 'Reunification Palace, Ho Chi Minh City, Vietnam', category: 'museum', vibes: ['history', 'budget'] },
        { name: 'Bui Vien Walking Street', searchQuery: 'Bui Vien Street, Ho Chi Minh City, Vietnam', category: 'attraction', vibes: ['nightlife', 'budget'] },
        { name: 'Notre-Dame Cathedral (Saigon)', searchQuery: 'Notre-Dame Cathedral Basilica of Saigon, Vietnam', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Mekong Delta',
      searchQuery: 'Mekong Delta, Vietnam',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Cai Be Floating Market', searchQuery: 'Cai Be Floating Market, Mekong Delta, Vietnam', category: 'attraction', vibes: ['history', 'food', 'budget'], mustSee: true },
        { name: 'Boat Tour Through Canals', searchQuery: 'Can Tho, Mekong Delta, Vietnam', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Phú Quốc',
      searchQuery: 'Phu Quoc Island, Vietnam',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Long Beach (Bãi Trường)', searchQuery: 'Long Beach, Phu Quoc, Vietnam', category: 'beach', vibes: ['beach'], mustSee: true },
        { name: 'An Thoi Archipelago Snorkelling', searchQuery: 'An Thoi Islands, Phu Quoc, Vietnam', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Phu Quoc Night Market', searchQuery: 'Phu Quoc Night Market, Vietnam', category: 'restaurant', vibes: ['food', 'nightlife', 'budget'] },
        { name: 'Sao Beach', searchQuery: 'Sao Beach, Phu Quoc, Vietnam', category: 'beach', vibes: ['beach'] },
      ],
    },
  ],

  // ── Japan ─────────────────────────────────────────────────────────────────
  'japan': [
    {
      name: 'Tokyo',
      searchQuery: 'Tokyo, Japan',
      minDays: 3, idealDays: 5, priority: 1,
      attractions: [
        { name: 'Senso-ji Temple, Asakusa', searchQuery: 'Senso-ji Temple, Asakusa, Tokyo, Japan', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Shibuya Crossing & Scramble', searchQuery: 'Shibuya Crossing, Tokyo, Japan', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Meiji Shrine & Harajuku', searchQuery: 'Meiji Shrine, Harajuku, Tokyo, Japan', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Tsukiji Outer Market', searchQuery: 'Tsukiji Market, Tokyo, Japan', category: 'restaurant', vibes: ['food'] },
        { name: 'Yanaka Old Neighbourhood', searchQuery: 'Yanaka, Tokyo, Japan', category: 'attraction', vibes: ['history'] },
        { name: 'Shinjuku Gyoen Garden', searchQuery: 'Shinjuku Gyoen, Tokyo, Japan', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Omoide Yokocho (Memory Lane food alley)', searchQuery: 'Omoide Yokocho, Shinjuku, Tokyo', category: 'restaurant', vibes: ['food', 'nightlife', 'budget'] },
        { name: 'Tokyo Skytree', searchQuery: 'Tokyo Skytree, Tokyo, Japan', category: 'viewpoint', vibes: ['nature'] },
        { name: 'teamLab Planets Toyosu', searchQuery: 'teamLab Planets, Toyosu, Tokyo', category: 'museum', vibes: ['history'] },
        { name: 'Hamarikyu Gardens (with tea ceremony)', searchQuery: 'Hamarikyu Gardens, Tokyo, Japan', category: 'park', vibes: ['nature', 'history'] },
      ],
    },
    {
      name: 'Kyoto',
      searchQuery: 'Kyoto, Japan',
      minDays: 3, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Fushimi Inari Shrine (1000 torii gates)', searchQuery: 'Fushimi Inari Shrine, Kyoto, Japan', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Arashiyama Bamboo Grove', searchQuery: 'Arashiyama Bamboo Grove, Kyoto, Japan', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Kinkaku-ji (Golden Pavilion)', searchQuery: 'Kinkaku-ji, Kyoto, Japan', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Gion District & Hanamikoji St', searchQuery: 'Gion, Kyoto, Japan', category: 'attraction', vibes: ['history', 'nightlife'] },
        { name: "Nishiki Market (\"Kyoto's Kitchen\")", searchQuery: 'Nishiki Market, Kyoto, Japan', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Kiyomizu-dera Temple', searchQuery: 'Kiyomizu-dera, Kyoto, Japan', category: 'attraction', vibes: ['history'] },
        { name: "Philosopher's Path (cherry blossom canal)", searchQuery: "Philosopher's Path, Kyoto, Japan", category: 'park', vibes: ['nature'] },
        { name: 'Nijo Castle', searchQuery: 'Nijo Castle, Kyoto, Japan', category: 'attraction', vibes: ['history'] },
        { name: 'Pontocho Alley (food & nightlife)', searchQuery: 'Pontocho, Kyoto, Japan', category: 'restaurant', vibes: ['food', 'nightlife'] },
      ],
    },
    {
      name: 'Osaka',
      searchQuery: 'Osaka, Japan',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Dotonbori (neon food street)', searchQuery: 'Dotonbori, Osaka, Japan', category: 'restaurant', vibes: ['food', 'nightlife', 'budget'], mustSee: true },
        { name: 'Osaka Castle & Park', searchQuery: 'Osaka Castle, Japan', category: 'attraction', vibes: ['history'] },
        { name: 'Kuromon Ichiba Market', searchQuery: 'Kuromon Market, Osaka, Japan', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Shinsekai District', searchQuery: 'Shinsekai, Osaka, Japan', category: 'attraction', vibes: ['history', 'food', 'budget'] },
        { name: 'Namba Grand Kagetsu (comedy)', searchQuery: 'Namba, Osaka, Japan', category: 'attraction', vibes: ['nightlife'] },
        { name: 'Sumiyoshi Taisha Shrine', searchQuery: 'Sumiyoshi Taisha, Osaka, Japan', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Hiroshima',
      searchQuery: 'Hiroshima, Japan',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Peace Memorial Museum', searchQuery: 'Hiroshima Peace Memorial Museum, Japan', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Atomic Bomb Dome (Genbaku Dome)', searchQuery: 'Atomic Bomb Dome, Hiroshima, Japan', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Miyajima Island & Itsukushima Shrine', searchQuery: 'Miyajima Island, Hiroshima, Japan', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Hiroshima Castle', searchQuery: 'Hiroshima Castle, Japan', category: 'attraction', vibes: ['history'] },
        { name: 'Shukkei-en Garden', searchQuery: 'Shukkei-en, Hiroshima, Japan', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Nara',
      searchQuery: 'Nara, Japan',
      minDays: 1, idealDays: 1, priority: 2,
      attractions: [
        { name: 'Nara Deer Park', searchQuery: 'Nara Deer Park, Japan', category: 'park', vibes: ['nature', 'budget'], mustSee: true },
        { name: 'Todai-ji Temple (Great Buddha)', searchQuery: 'Todai-ji, Nara, Japan', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Kasuga Taisha Shrine', searchQuery: 'Kasuga Taisha, Nara, Japan', category: 'attraction', vibes: ['history'] },
      ],
    },
    {
      name: 'Kanazawa',
      searchQuery: 'Kanazawa, Japan',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Kenroku-en Garden (top 3 in Japan)', searchQuery: 'Kenroku-en, Kanazawa, Japan', category: 'park', vibes: ['nature', 'history'], mustSee: true },
        { name: 'Higashi Chaya geisha district', searchQuery: 'Higashi Chaya, Kanazawa, Japan', category: 'attraction', vibes: ['history'] },
        { name: 'Omicho Market (fresh seafood)', searchQuery: 'Omicho Market, Kanazawa, Japan', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: '21st Century Museum of Contemporary Art', searchQuery: '21st Century Museum of Contemporary Art, Kanazawa', category: 'museum', vibes: ['history'] },
      ],
    },
    {
      name: 'Hakone',
      searchQuery: 'Hakone, Kanagawa, Japan',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Mt Fuji View from Lake Ashi', searchQuery: 'Lake Ashi, Hakone, Japan', category: 'viewpoint', vibes: ['nature'], mustSee: true },
        { name: 'Open Air Museum Hakone', searchQuery: 'Hakone Open Air Museum, Japan', category: 'museum', vibes: ['history', 'nature'] },
        { name: 'Owakudani Volcanic Valley', searchQuery: 'Owakudani, Hakone, Japan', category: 'park', vibes: ['nature'] },
      ],
    },
  ],

  // ── Thailand ──────────────────────────────────────────────────────────────
  'thailand': [
    {
      name: 'Bangkok',
      searchQuery: 'Bangkok, Thailand',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Wat Phra Kaew & Grand Palace', searchQuery: 'Wat Phra Kaew, Bangkok, Thailand', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Wat Arun (Temple of Dawn)', searchQuery: 'Wat Arun, Bangkok, Thailand', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Chatuchak Weekend Market', searchQuery: 'Chatuchak Market, Bangkok, Thailand', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Chinatown (Yaowarat) food walk', searchQuery: 'Yaowarat, Bangkok, Thailand', category: 'restaurant', vibes: ['food', 'budget', 'nightlife'] },
        { name: 'Wat Pho & Reclining Buddha', searchQuery: 'Wat Pho, Bangkok, Thailand', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Asiatique The Riverfront', searchQuery: 'Asiatique, Bangkok, Thailand', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Lumphini Park', searchQuery: 'Lumphini Park, Bangkok, Thailand', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Damnoen Saduak Floating Market', searchQuery: 'Damnoen Saduak Floating Market, Thailand', category: 'restaurant', vibes: ['food', 'history'] },
      ],
    },
    {
      name: 'Chiang Mai',
      searchQuery: 'Chiang Mai, Thailand',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Doi Suthep Temple & Mountain View', searchQuery: 'Doi Suthep, Chiang Mai, Thailand', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Old City Temples Walk', searchQuery: 'Wat Chedi Luang, Chiang Mai, Thailand', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Elephant Nature Park (ethical)', searchQuery: 'Elephant Nature Park, Chiang Mai, Thailand', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Sunday Night Walking Street Market', searchQuery: 'Walking Street Market, Chiang Mai, Thailand', category: 'restaurant', vibes: ['food', 'budget', 'nightlife'] },
        { name: 'Thai Cooking Class', searchQuery: 'Thai cooking class, Chiang Mai, Thailand', category: 'attraction', vibes: ['food'] },
        { name: 'Nimman Road Cafés & Restaurants', searchQuery: 'Nimman Road, Chiang Mai, Thailand', category: 'restaurant', vibes: ['food', 'nightlife'] },
        { name: 'Doi Inthanon National Park', searchQuery: 'Doi Inthanon National Park, Thailand', category: 'park', vibes: ['nature'] },
      ],
    },
    {
      name: 'Krabi',
      searchQuery: 'Krabi, Thailand',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Railay Beach (by boat)', searchQuery: 'Railay Beach, Krabi, Thailand', category: 'beach', vibes: ['beach', 'nature'], mustSee: true },
        { name: 'Phi Phi Islands Day Trip', searchQuery: 'Phi Phi Islands, Krabi, Thailand', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Tiger Cave Temple (1237 steps)', searchQuery: 'Tiger Cave Temple, Krabi, Thailand', category: 'viewpoint', vibes: ['nature', 'history', 'budget'] },
        { name: 'Four Islands Snorkelling Tour', searchQuery: 'Four Islands Tour, Krabi, Thailand', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Kayaking in Mangroves', searchQuery: 'mangrove kayaking, Ao Thalane, Krabi', category: 'park', vibes: ['nature'] },
      ],
    },
    {
      name: 'Ko Samui',
      searchQuery: 'Ko Samui, Thailand',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Chaweng Beach', searchQuery: 'Chaweng Beach, Ko Samui, Thailand', category: 'beach', vibes: ['beach', 'nightlife'], mustSee: true },
        { name: 'Ang Thong Marine Park', searchQuery: 'Ang Thong Marine Park, Thailand', category: 'park', vibes: ['nature', 'beach'] },
        { name: "Fisherman's Village, Bophut", searchQuery: "Fisherman's Village, Bophut, Ko Samui", category: 'restaurant', vibes: ['food', 'nightlife'] },
        { name: 'Namuang Waterfall', searchQuery: 'Namuang Waterfall, Ko Samui, Thailand', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Chiang Rai',
      searchQuery: 'Chiang Rai, Thailand',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Wat Rong Khun (White Temple)', searchQuery: 'Wat Rong Khun, Chiang Rai, Thailand', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Black House Museum (Baan Dam)', searchQuery: 'Black House, Chiang Rai, Thailand', category: 'museum', vibes: ['history'] },
        { name: 'Golden Triangle', searchQuery: 'Golden Triangle, Chiang Rai, Thailand', category: 'viewpoint', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Pai',
      searchQuery: 'Pai, Mae Hong Son, Thailand',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Pai Canyon', searchQuery: 'Pai Canyon, Mae Hong Son, Thailand', category: 'viewpoint', vibes: ['nature', 'budget'], mustSee: true },
        { name: 'Mo Paeng Waterfall', searchQuery: 'Mo Paeng Waterfall, Pai, Thailand', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Pai Night Market', searchQuery: 'Pai Night Market, Mae Hong Son, Thailand', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Koh Lanta',
      searchQuery: 'Ko Lanta, Krabi, Thailand',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Long Beach', searchQuery: 'Long Beach, Ko Lanta, Thailand', category: 'beach', vibes: ['beach'], mustSee: true },
        { name: 'Old Town Ko Lanta', searchQuery: 'Old Town, Ko Lanta, Krabi, Thailand', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Mu Koh Lanta Marine Park', searchQuery: 'Mu Ko Lanta National Park, Thailand', category: 'park', vibes: ['nature', 'beach'] },
      ],
    },
  ],

  // ── Southeast Asia (multi-country) ────────────────────────────────────────
  'southeast asia': [
    {
      name: 'Bangkok',
      searchQuery: 'Bangkok, Thailand',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Wat Phra Kaew & Grand Palace', searchQuery: 'Wat Phra Kaew, Bangkok, Thailand', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Wat Arun (Temple of Dawn)', searchQuery: 'Wat Arun, Bangkok, Thailand', category: 'attraction', vibes: ['history'] },
        { name: 'Chinatown food walk', searchQuery: 'Yaowarat, Bangkok, Thailand', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Chatuchak Weekend Market', searchQuery: 'Chatuchak Market, Bangkok, Thailand', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Chiang Mai',
      searchQuery: 'Chiang Mai, Thailand',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Doi Suthep Temple', searchQuery: 'Doi Suthep, Chiang Mai, Thailand', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Elephant Nature Park', searchQuery: 'Elephant Nature Park, Chiang Mai, Thailand', category: 'park', vibes: ['nature'] },
        { name: 'Sunday Night Market', searchQuery: 'Walking Street Market, Chiang Mai, Thailand', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Siem Reap',
      searchQuery: 'Siem Reap, Cambodia',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Angkor Wat at Sunrise', searchQuery: 'Angkor Wat, Siem Reap, Cambodia', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Angkor Thom & Bayon Temple', searchQuery: 'Angkor Thom, Siem Reap, Cambodia', category: 'attraction', vibes: ['history'] },
        { name: 'Ta Prohm (jungle temple)', searchQuery: 'Ta Prohm, Siem Reap, Cambodia', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Pub Street & Night Market', searchQuery: 'Pub Street, Siem Reap, Cambodia', category: 'restaurant', vibes: ['food', 'nightlife', 'budget'] },
        { name: 'Tonle Sap Lake Floating Village', searchQuery: 'Tonle Sap Lake, Siem Reap, Cambodia', category: 'park', vibes: ['history', 'nature'] },
      ],
    },
    {
      name: 'Hanoi',
      searchQuery: 'Hanoi, Vietnam',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Hoan Kiem Lake & Old Quarter', searchQuery: 'Hoan Kiem Lake, Hanoi, Vietnam', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Ho Chi Minh Mausoleum', searchQuery: 'Ho Chi Minh Mausoleum, Hanoi, Vietnam', category: 'attraction', vibes: ['history'] },
        { name: 'Bun Cha street food lunch', searchQuery: 'Bun Cha, Hanoi, Vietnam', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Hội An',
      searchQuery: 'Hoi An, Vietnam',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Ancient Town Lantern Stroll', searchQuery: 'Ancient Town, Hoi An, Vietnam', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'An Bang Beach', searchQuery: 'An Bang Beach, Hoi An, Vietnam', category: 'beach', vibes: ['beach'] },
        { name: 'Cooking Class + Market Tour', searchQuery: 'cooking class, Hoi An, Vietnam', category: 'attraction', vibes: ['food'] },
      ],
    },
    {
      name: 'Ho Chi Minh City',
      searchQuery: 'Ho Chi Minh City, Vietnam',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'War Remnants Museum', searchQuery: 'War Remnants Museum, Ho Chi Minh City, Vietnam', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Cu Chi Tunnels', searchQuery: 'Cu Chi Tunnels, Ho Chi Minh City, Vietnam', category: 'attraction', vibes: ['history'] },
        { name: 'Ben Thanh Market', searchQuery: 'Ben Thanh Market, Ho Chi Minh City, Vietnam', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Bali',
      searchQuery: 'Bali, Indonesia',
      minDays: 3, idealDays: 5, priority: 2,
      attractions: [
        { name: 'Tanah Lot Temple at Sunset', searchQuery: 'Tanah Lot, Bali, Indonesia', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Tegallalang Rice Terraces', searchQuery: 'Tegallalang Rice Terraces, Bali, Indonesia', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Uluwatu Cliff Temple', searchQuery: 'Uluwatu Temple, Bali, Indonesia', category: 'viewpoint', vibes: ['history', 'nature'] },
        { name: 'Seminyak Beach & Sunset', searchQuery: 'Seminyak Beach, Bali, Indonesia', category: 'beach', vibes: ['beach', 'nightlife'] },
        { name: 'Ubud Monkey Forest & Market', searchQuery: 'Monkey Forest Sanctuary, Ubud, Bali', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Luang Prabang',
      searchQuery: 'Luang Prabang, Laos',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Alms Giving Ceremony at Dawn', searchQuery: 'Luang Prabang alms ceremony, Laos', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Kuang Si Waterfalls', searchQuery: 'Kuang Si Waterfalls, Luang Prabang, Laos', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Mount Phousi Viewpoint', searchQuery: 'Mount Phousi, Luang Prabang, Laos', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Night Market on Sisavangvong Rd', searchQuery: 'Night Market, Luang Prabang, Laos', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
  ],

  // ── Morocco ───────────────────────────────────────────────────────────────
  'morocco': [
    {
      name: 'Marrakech',
      searchQuery: 'Marrakech, Morocco',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Jemaa el-Fna Square at Sunset', searchQuery: 'Jemaa el-Fna, Marrakech, Morocco', category: 'attraction', vibes: ['history', 'food', 'budget'], mustSee: true },
        { name: 'Majorelle Garden & Yves Saint Laurent Museum', searchQuery: 'Majorelle Garden, Marrakech, Morocco', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Medina Souks (spices, leather, lamps)', searchQuery: 'Souks of Marrakech, Morocco', category: 'attraction', vibes: ['history', 'food'] },
        { name: 'Bahia Palace', searchQuery: 'Bahia Palace, Marrakech, Morocco', category: 'museum', vibes: ['history', 'budget'] },
        { name: 'Saadian Tombs', searchQuery: 'Saadian Tombs, Marrakech, Morocco', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Hammam Tradition Experience', searchQuery: 'Hammam, Marrakech, Morocco', category: 'other', vibes: ['history'] },
        { name: 'Koutoubia Mosque & Gardens', searchQuery: 'Koutoubia Mosque, Marrakech, Morocco', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Mellah (Jewish Quarter)', searchQuery: 'Mellah, Marrakech, Morocco', category: 'attraction', vibes: ['history'] },
      ],
    },
    {
      name: 'Chefchaouen',
      searchQuery: 'Chefchaouen, Morocco',
      minDays: 1, idealDays: 2, priority: 1,
      attractions: [
        { name: 'Blue Medina Streets & Photowalk', searchQuery: 'Chefchaouen Medina, Morocco', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Spanish Mosque Viewpoint', searchQuery: 'Spanish Mosque, Chefchaouen, Morocco', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Ras El Maa Waterfall & Kasbah', searchQuery: 'Ras El Maa, Chefchaouen, Morocco', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Local market & food stalls', searchQuery: 'Plaza Uta el-Hammam, Chefchaouen', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Fes',
      searchQuery: 'Fes, Morocco',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Fes el-Bali Medina (UNESCO)', searchQuery: 'Fes el-Bali Medina, Morocco', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Chouara Tannery Viewpoint', searchQuery: 'Chouara Tannery, Fes, Morocco', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Al-Qarawiyyin (oldest university in world)', searchQuery: 'Al-Qarawiyyin, Fes, Morocco', category: 'museum', vibes: ['history'] },
        { name: 'Bou Inania Madrasa', searchQuery: 'Bou Inania Madrasa, Fes, Morocco', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Merenid Tombs Viewpoint', searchQuery: 'Merenid Tombs, Fes, Morocco', category: 'viewpoint', vibes: ['budget'] },
        { name: 'Fes el-Jdid & Royal Palace Gates', searchQuery: 'Royal Palace, Fes el-Jdid, Morocco', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Merzouga',
      searchQuery: 'Merzouga, Morocco',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Erg Chebbi Desert Camel Trek', searchQuery: 'Erg Chebbi, Merzouga, Morocco', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Desert Camp Overnight', searchQuery: 'desert camp, Merzouga, Morocco', category: 'park', vibes: ['nature'] },
        { name: 'Erg Chebbi Dunes at Sunrise', searchQuery: 'Erg Chebbi sunrise, Merzouga, Morocco', category: 'viewpoint', vibes: ['nature'] },
      ],
    },
    {
      name: 'Essaouira',
      searchQuery: 'Essaouira, Morocco',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Medina Ramparts & Skala de la Ville', searchQuery: 'Skala de la Ville, Essaouira, Morocco', category: 'viewpoint', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Essaouira Fish Market & Grills', searchQuery: 'fish market, Essaouira, Morocco', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Essaouira Beach (kite & windsurfing)', searchQuery: 'Essaouira Beach, Morocco', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Gnaoua Music Scene & Medina', searchQuery: 'Essaouira medina, Morocco', category: 'attraction', vibes: ['nightlife', 'history'] },
      ],
    },
    {
      name: 'Casablanca',
      searchQuery: 'Casablanca, Morocco',
      minDays: 1, idealDays: 1, priority: 3,
      attractions: [
        { name: 'Hassan II Mosque (largest in Africa)', searchQuery: 'Hassan II Mosque, Casablanca, Morocco', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Corniche Waterfront', searchQuery: 'Corniche, Casablanca, Morocco', category: 'viewpoint', vibes: ['budget', 'nightlife'] },
        { name: 'Rick\'s Café', searchQuery: "Rick's Cafe, Casablanca, Morocco", category: 'restaurant', vibes: ['food', 'history'] },
      ],
    },
  ],

  // ── Italy ─────────────────────────────────────────────────────────────────
  'italy': [
    {
      name: 'Rome',
      searchQuery: 'Rome, Italy',
      minDays: 3, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Colosseum & Roman Forum', searchQuery: 'Colosseum, Rome, Italy', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Vatican Museums & Sistine Chapel', searchQuery: 'Vatican Museums, Rome, Italy', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Pantheon', searchQuery: 'Pantheon, Rome, Italy', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Trastevere Neighbourhood (dinner & wine)', searchQuery: 'Trastevere, Rome, Italy', category: 'restaurant', vibes: ['food', 'nightlife'] },
        { name: 'Campo de\' Fiori Morning Market', searchQuery: "Campo de' Fiori, Rome, Italy", category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Piazza Navona', searchQuery: 'Piazza Navona, Rome, Italy', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Borghese Gallery (book ahead)', searchQuery: 'Borghese Gallery, Rome, Italy', category: 'museum', vibes: ['history'] },
        { name: 'Testaccio Food Market', searchQuery: 'Mercato di Testaccio, Rome, Italy', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Palatine Hill Views', searchQuery: 'Palatine Hill, Rome, Italy', category: 'viewpoint', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Florence',
      searchQuery: 'Florence, Italy',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Uffizi Gallery', searchQuery: 'Uffizi Gallery, Florence, Italy', category: 'museum', vibes: ['history'], mustSee: true },
        { name: "Michelangelo's David (Accademia)", searchQuery: 'Accademia Gallery, Florence, Italy', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Duomo & Brunelleschi Dome Climb', searchQuery: 'Florence Cathedral Dome, Italy', category: 'viewpoint', vibes: ['history'] },
        { name: 'Oltrarno Neighbourhood & Artisan Shops', searchQuery: 'Oltrarno, Florence, Italy', category: 'attraction', vibes: ['history', 'food'] },
        { name: 'Piazzale Michelangelo (sunset)', searchQuery: 'Piazzale Michelangelo, Florence, Italy', category: 'viewpoint', vibes: ['nature', 'budget'] },
        { name: 'Mercato Centrale (truffle, pasta, gelato)', searchQuery: 'Mercato Centrale, Florence, Italy', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Ponte Vecchio', searchQuery: 'Ponte Vecchio, Florence, Italy', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Venice',
      searchQuery: 'Venice, Italy',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: "St Mark's Basilica & Piazza", searchQuery: "St Mark's Basilica, Venice, Italy", category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Doge\'s Palace', searchQuery: "Doge's Palace, Venice, Italy", category: 'museum', vibes: ['history'] },
        { name: 'Rialto Bridge & Fish Market', searchQuery: 'Rialto Market, Venice, Italy', category: 'restaurant', vibes: ['food', 'history'] },
        { name: 'Burano Island (colourful houses)', searchQuery: 'Burano Island, Venice, Italy', category: 'attraction', vibes: ['history'] },
        { name: 'Accademia Gallery', searchQuery: 'Gallerie dell\'Accademia, Venice, Italy', category: 'museum', vibes: ['history'] },
        { name: 'Castello Sestiere Walk (quieter Venice)', searchQuery: 'Castello, Venice, Italy', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Cicchetti bar-hop in Cannaregio', searchQuery: 'Cannaregio, Venice, Italy', category: 'restaurant', vibes: ['food', 'nightlife', 'budget'] },
      ],
    },
    {
      name: 'Cinque Terre',
      searchQuery: 'Cinque Terre, Italy',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Sentiero Azzurro Coastal Hike', searchQuery: 'Cinque Terre coastal trail, Italy', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Vernazza village & harbour', searchQuery: 'Vernazza, Cinque Terre, Italy', category: 'attraction', vibes: ['history', 'beach'] },
        { name: 'Monterosso al Mare Beach', searchQuery: 'Monterosso al Mare, Cinque Terre, Italy', category: 'beach', vibes: ['beach'] },
        { name: 'Manarola at sunset', searchQuery: 'Manarola, Cinque Terre, Italy', category: 'viewpoint', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Amalfi Coast',
      searchQuery: 'Amalfi, Salerno, Italy',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Positano Village & Beach', searchQuery: 'Positano, Amalfi Coast, Italy', category: 'beach', vibes: ['beach', 'history'], mustSee: true },
        { name: 'Path of the Gods Hike (Sentiero degli Dei)', searchQuery: 'Path of the Gods, Amalfi Coast, Italy', category: 'park', vibes: ['nature'] },
        { name: 'Amalfi Cathedral & Town', searchQuery: 'Amalfi Cathedral, Italy', category: 'attraction', vibes: ['history'] },
        { name: 'Ravello Gardens & Villa Cimbrone', searchQuery: 'Villa Cimbrone, Ravello, Italy', category: 'viewpoint', vibes: ['nature', 'history'] },
        { name: 'Limoncello Tasting & Lemon Groves', searchQuery: 'Amalfi coast lemon tour, Italy', category: 'restaurant', vibes: ['food'] },
      ],
    },
    {
      name: 'Sicily',
      searchQuery: 'Palermo, Sicily, Italy',
      minDays: 2, idealDays: 4, priority: 3,
      attractions: [
        { name: 'Valle dei Templi (Greek Temples, Agrigento)', searchQuery: 'Valley of Temples, Agrigento, Sicily', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Palermo Street Food (Mercato di Ballarò)', searchQuery: 'Ballarò Market, Palermo, Sicily', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Mount Etna (cable car + hike)', searchQuery: 'Mount Etna, Sicily, Italy', category: 'mountain', vibes: ['nature'] },
        { name: 'Taormina & Ancient Theatre', searchQuery: 'Greek Theatre, Taormina, Sicily', category: 'attraction', vibes: ['history'] },
        { name: 'Siracusa & Ortigia Island', searchQuery: 'Ortigia, Siracusa, Sicily, Italy', category: 'attraction', vibes: ['history', 'beach'] },
      ],
    },
  ],

  // ── Spain ─────────────────────────────────────────────────────────────────
  'spain': [
    {
      name: 'Madrid',
      searchQuery: 'Madrid, Spain',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Prado Museum', searchQuery: 'Prado Museum, Madrid, Spain', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Retiro Park', searchQuery: 'Retiro Park, Madrid, Spain', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Mercado San Miguel', searchQuery: 'Mercado San Miguel, Madrid, Spain', category: 'restaurant', vibes: ['food'] },
        { name: 'Malasaña & Chueca Neighbourhoods', searchQuery: 'Malasaña, Madrid, Spain', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Royal Palace of Madrid', searchQuery: 'Royal Palace, Madrid, Spain', category: 'museum', vibes: ['history'] },
        { name: 'La Latina Tapas Bars (Calle Cava Baja)', searchQuery: 'Calle Cava Baja, Madrid, Spain', category: 'restaurant', vibes: ['food', 'nightlife', 'budget'] },
        { name: 'Thyssen-Bornemisza Museum', searchQuery: 'Thyssen Museum, Madrid, Spain', category: 'museum', vibes: ['history'] },
      ],
    },
    {
      name: 'Barcelona',
      searchQuery: 'Barcelona, Spain',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Sagrada Família', searchQuery: 'Sagrada Familia, Barcelona, Spain', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Park Güell', searchQuery: 'Park Güell, Barcelona, Spain', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Mercat de la Boqueria', searchQuery: 'Boqueria Market, Barcelona, Spain', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Gothic Quarter (Barri Gòtic)', searchQuery: 'Gothic Quarter, Barcelona, Spain', category: 'attraction', vibes: ['history'] },
        { name: 'Barceloneta Beach', searchQuery: 'Barceloneta Beach, Barcelona, Spain', category: 'beach', vibes: ['beach'] },
        { name: 'El Raval & Picasso Museum', searchQuery: 'Picasso Museum, Barcelona, Spain', category: 'museum', vibes: ['history'] },
        { name: 'Gràcia Neighbourhood & Vermouth', searchQuery: 'Gracia, Barcelona, Spain', category: 'restaurant', vibes: ['food', 'nightlife'] },
      ],
    },
    {
      name: 'Seville',
      searchQuery: 'Seville, Spain',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Real Alcázar (Royal Palace & Gardens)', searchQuery: 'Real Alcázar, Seville, Spain', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Seville Cathedral & Giralda Tower', searchQuery: 'Seville Cathedral, Spain', category: 'viewpoint', vibes: ['history'] },
        { name: 'Barrio de Santa Cruz (Jewish Quarter)', searchQuery: 'Barrio de Santa Cruz, Seville, Spain', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Triana Neighbourhood & Flamenco', searchQuery: 'Triana, Seville, Spain', category: 'attraction', vibes: ['nightlife', 'history', 'food'] },
        { name: 'Mercado de Triana', searchQuery: 'Mercado de Triana, Seville, Spain', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Metropol Parasol (Las Setas) rooftop', searchQuery: 'Metropol Parasol, Seville, Spain', category: 'viewpoint', vibes: ['budget', 'history'] },
      ],
    },
    {
      name: 'Granada',
      searchQuery: 'Granada, Spain',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Alhambra Palace & Generalife Gardens', searchQuery: 'Alhambra, Granada, Spain', category: 'museum', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Albaicín Moorish Quarter', searchQuery: 'Albaicín, Granada, Spain', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'San Nicolás Viewpoint (Alhambra view)', searchQuery: 'Mirador San Nicolás, Granada, Spain', category: 'viewpoint', vibes: ['budget', 'history'] },
        { name: 'Sacromonte Cave Flamenco', searchQuery: 'Sacromonte, Granada, Spain', category: 'attraction', vibes: ['nightlife', 'history'] },
        { name: 'Mercado San Agustín (tapas culture)', searchQuery: 'Mercado San Agustín, Granada, Spain', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'San Sebastián',
      searchQuery: 'San Sebastian, Spain',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Pintxos Bar Crawl in Parte Vieja', searchQuery: 'Parte Vieja, San Sebastian, Spain', category: 'restaurant', vibes: ['food', 'nightlife'], mustSee: true },
        { name: 'La Concha Beach', searchQuery: 'La Concha Beach, San Sebastian, Spain', category: 'beach', vibes: ['beach'] },
        { name: 'Monte Igueldo View & Funicular', searchQuery: 'Monte Igueldo, San Sebastian, Spain', category: 'viewpoint', vibes: ['nature', 'budget'] },
        { name: 'San Telmo Museoa', searchQuery: 'San Telmo Museum, San Sebastian, Spain', category: 'museum', vibes: ['history'] },
      ],
    },
    {
      name: 'Valencia',
      searchQuery: 'Valencia, Spain',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'City of Arts & Sciences', searchQuery: 'City of Arts and Sciences, Valencia, Spain', category: 'museum', vibes: ['history'], mustSee: true },
        { name: 'Mercado Central Valencia', searchQuery: 'Mercado Central, Valencia, Spain', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Malvarrosa Beach', searchQuery: 'Malvarrosa Beach, Valencia, Spain', category: 'beach', vibes: ['beach'] },
        { name: 'El Carmen Neighbourhood', searchQuery: 'El Carmen, Valencia, Spain', category: 'attraction', vibes: ['food', 'nightlife', 'history'] },
      ],
    },
  ],

  // ── Portugal ──────────────────────────────────────────────────────────────
  'portugal': [
    {
      name: 'Lisbon',
      searchQuery: 'Lisbon, Portugal',
      minDays: 2, idealDays: 4, priority: 1,
      attractions: [
        { name: 'Belém Tower & Jerónimos Monastery', searchQuery: 'Belém Tower, Lisbon, Portugal', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Alfama (fado music & castle)', searchQuery: 'Alfama, Lisbon, Portugal', category: 'attraction', vibes: ['history', 'nightlife'], mustSee: true },
        { name: 'LX Factory Sunday Market', searchQuery: 'LX Factory, Lisbon, Portugal', category: 'restaurant', vibes: ['food', 'nightlife'] },
        { name: 'Tram 28 Through Historic Hills', searchQuery: 'Tram 28, Lisbon, Portugal', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Time Out Market Lisboa', searchQuery: 'Time Out Market, Lisbon, Portugal', category: 'restaurant', vibes: ['food'] },
        { name: 'Castelo de São Jorge', searchQuery: 'São Jorge Castle, Lisbon, Portugal', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Pastéis de Belém (custard tarts)', searchQuery: 'Pastéis de Belém, Lisbon, Portugal', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Bairro Alto Nightlife', searchQuery: 'Bairro Alto, Lisbon, Portugal', category: 'attraction', vibes: ['nightlife'] },
      ],
    },
    {
      name: 'Porto',
      searchQuery: 'Porto, Portugal',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Livraria Lello Bookshop', searchQuery: 'Livraria Lello, Porto, Portugal', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Ribeira District & Dom Luís Bridge', searchQuery: 'Ribeira, Porto, Portugal', category: 'attraction', vibes: ['history', 'food'], mustSee: true },
        { name: 'Port Wine Cellars (Vila Nova de Gaia)', searchQuery: 'Vila Nova de Gaia, Porto, Portugal', category: 'restaurant', vibes: ['food', 'history'] },
        { name: 'Clérigos Tower Viewpoint', searchQuery: 'Clérigos Tower, Porto, Portugal', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Matosinhos Seafood Restaurants', searchQuery: 'Matosinhos, Porto, Portugal', category: 'restaurant', vibes: ['food'] },
        { name: 'Mercado do Bolhão', searchQuery: 'Mercado do Bolhão, Porto, Portugal', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Foz do Douro (river meets ocean)', searchQuery: 'Foz do Douro, Porto, Portugal', category: 'beach', vibes: ['nature', 'beach'] },
      ],
    },
    {
      name: 'Sintra',
      searchQuery: 'Sintra, Portugal',
      minDays: 1, idealDays: 1, priority: 2,
      attractions: [
        { name: 'Pena Palace (colourful hilltop palace)', searchQuery: 'Pena Palace, Sintra, Portugal', category: 'museum', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Quinta da Regaleira (mystical gardens)', searchQuery: 'Quinta da Regaleira, Sintra, Portugal', category: 'park', vibes: ['nature', 'history'] },
        { name: 'Moorish Castle Ruins', searchQuery: 'Moorish Castle, Sintra, Portugal', category: 'viewpoint', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Algarve',
      searchQuery: 'Lagos, Algarve, Portugal',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Benagil Cave Boat Tour', searchQuery: 'Benagil Cave, Algarve, Portugal', category: 'park', vibes: ['nature', 'beach'], mustSee: true },
        { name: 'Praia da Marinha (wild beach)', searchQuery: 'Praia da Marinha, Algarve, Portugal', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Ponta da Piedade Sea Cliffs', searchQuery: 'Ponta da Piedade, Lagos, Portugal', category: 'viewpoint', vibes: ['nature', 'budget'] },
        { name: 'Lagos Old Town', searchQuery: 'Lagos old town, Algarve, Portugal', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Sagres Fortress & Cabo de São Vicente', searchQuery: 'Sagres, Algarve, Portugal', category: 'viewpoint', vibes: ['nature', 'history'] },
      ],
    },
    {
      name: 'Évora',
      searchQuery: 'Évora, Portugal',
      minDays: 1, idealDays: 1, priority: 3,
      attractions: [
        { name: 'Chapel of Bones (bone church)', searchQuery: 'Chapel of Bones, Évora, Portugal', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Roman Temple of Évora', searchQuery: 'Roman Temple, Évora, Portugal', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
  ],

  // ── Greece ────────────────────────────────────────────────────────────────
  'greece': [
    {
      name: 'Athens',
      searchQuery: 'Athens, Greece',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Acropolis & Parthenon', searchQuery: 'Acropolis, Athens, Greece', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Acropolis Museum', searchQuery: 'Acropolis Museum, Athens, Greece', category: 'museum', vibes: ['history'] },
        { name: 'Plaka & Monastiraki Neighbourhoods', searchQuery: 'Plaka, Athens, Greece', category: 'attraction', vibes: ['history', 'food', 'budget'] },
        { name: 'Ancient Agora', searchQuery: 'Ancient Agora, Athens, Greece', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Monastiraki Flea Market', searchQuery: 'Monastiraki Flea Market, Athens, Greece', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Cape Sounion (Temple of Poseidon)', searchQuery: 'Cape Sounion, Greece', category: 'viewpoint', vibes: ['history', 'nature'] },
        { name: 'Psirri Neighbourhood (nightlife & mezze)', searchQuery: 'Psirri, Athens, Greece', category: 'restaurant', vibes: ['nightlife', 'food'] },
      ],
    },
    {
      name: 'Santorini',
      searchQuery: 'Santorini, Greece',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Oia Village Sunset', searchQuery: 'Oia, Santorini, Greece', category: 'viewpoint', vibes: ['history', 'beach'], mustSee: true },
        { name: 'Fira (Thira) Main Town', searchQuery: 'Fira, Santorini, Greece', category: 'attraction', vibes: ['food', 'nightlife'] },
        { name: 'Akrotiri Archaeological Site', searchQuery: 'Akrotiri, Santorini, Greece', category: 'museum', vibes: ['history'] },
        { name: 'Perivolos or Perissa Black Sand Beach', searchQuery: 'Perissa Beach, Santorini, Greece', category: 'beach', vibes: ['beach'] },
        { name: 'Caldera Boat Tour (volcano & hot springs)', searchQuery: 'volcano Santorini boat tour, Greece', category: 'park', vibes: ['nature'] },
        { name: 'Pyrgos Village (quieter alternative)', searchQuery: 'Pyrgos, Santorini, Greece', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Crete',
      searchQuery: 'Heraklion, Crete, Greece',
      minDays: 2, idealDays: 4, priority: 2,
      attractions: [
        { name: 'Knossos Palace (Minoan Civilisation)', searchQuery: 'Knossos, Heraklion, Crete, Greece', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Samariá Gorge Hike', searchQuery: 'Samaria Gorge, Crete, Greece', category: 'park', vibes: ['nature'] },
        { name: 'Elafonisi Beach (pink sand)', searchQuery: 'Elafonisi Beach, Crete, Greece', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Rethymno Old Town & Lighthouse', searchQuery: 'Rethymno old town, Crete, Greece', category: 'attraction', vibes: ['history', 'food', 'budget'] },
        { name: 'Balos Lagoon Boat Trip', searchQuery: 'Balos Lagoon, Crete, Greece', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Chania Waterfront (Venetian harbour)', searchQuery: 'Chania harbour, Crete, Greece', category: 'restaurant', vibes: ['food', 'nightlife', 'history'] },
      ],
    },
    {
      name: 'Meteora',
      searchQuery: 'Meteora, Kalampaka, Greece',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Meteora Monasteries (UNESCO)', searchQuery: 'Meteora monasteries, Kalampaka, Greece', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Varlaam Monastery Interior', searchQuery: 'Varlaam Monastery, Meteora, Greece', category: 'museum', vibes: ['history'] },
        { name: 'Sunset Viewpoint Rock Hike', searchQuery: 'Meteora viewpoint, Greece', category: 'viewpoint', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Mykonos',
      searchQuery: 'Mykonos, Greece',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Little Venice Waterfront', searchQuery: 'Little Venice, Mykonos, Greece', category: 'attraction', vibes: ['history', 'nightlife'], mustSee: true },
        { name: 'Windmills of Mykonos', searchQuery: 'Windmills, Mykonos, Greece', category: 'viewpoint', vibes: ['history', 'budget'] },
        { name: 'Paradise Beach', searchQuery: 'Paradise Beach, Mykonos, Greece', category: 'beach', vibes: ['beach', 'nightlife'] },
        { name: 'Chora (Mykonos Town) food scene', searchQuery: 'Mykonos Town, Greece', category: 'restaurant', vibes: ['food', 'nightlife'] },
        { name: 'Ano Mera Village (authentic Mykonos)', searchQuery: 'Ano Mera, Mykonos, Greece', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Rhodes',
      searchQuery: 'Rhodes, Greece',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Rhodes Old Town (UNESCO medieval city)', searchQuery: 'Rhodes Old Town, Greece', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Palace of the Grand Master', searchQuery: 'Palace of the Grand Master, Rhodes, Greece', category: 'museum', vibes: ['history'] },
        { name: 'Lindos Acropolis & Village', searchQuery: 'Lindos, Rhodes, Greece', category: 'viewpoint', vibes: ['history', 'beach'] },
        { name: 'Tsambika Beach', searchQuery: 'Tsambika Beach, Rhodes, Greece', category: 'beach', vibes: ['beach'] },
      ],
    },
  ],

  // ── Balkans ───────────────────────────────────────────────────────────────
  'balkans': [
    {
      name: 'Dubrovnik',
      searchQuery: 'Dubrovnik, Croatia',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Old Town City Walls Walk', searchQuery: 'Dubrovnik City Walls, Croatia', category: 'viewpoint', vibes: ['history'], mustSee: true },
        { name: 'Stradun (Placa) Main Street', searchQuery: 'Stradun, Dubrovnik, Croatia', category: 'attraction', vibes: ['history', 'food', 'budget'] },
        { name: 'Fort Lovrijenac & Game of Thrones locations', searchQuery: 'Fort Lovrijenac, Dubrovnik, Croatia', category: 'attraction', vibes: ['history'] },
        { name: 'Lokrum Island (boat trip)', searchQuery: 'Lokrum Island, Dubrovnik, Croatia', category: 'park', vibes: ['nature', 'beach'] },
        { name: 'Cable Car to Mt Srđ', searchQuery: 'Mount Srđ, Dubrovnik, Croatia', category: 'viewpoint', vibes: ['nature'] },
        { name: 'Oyster tasting in Ston', searchQuery: 'Ston, Dubrovnik-Neretva, Croatia', category: 'restaurant', vibes: ['food'] },
      ],
    },
    {
      name: 'Split',
      searchQuery: 'Split, Croatia',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: "Diocletian's Palace (lived-in ruins)", searchQuery: "Diocletian's Palace, Split, Croatia", category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Marjan Hill Forest Park', searchQuery: 'Marjan Hill, Split, Croatia', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Hvar Island Day Trip', searchQuery: 'Hvar, Croatia', category: 'beach', vibes: ['beach', 'nightlife'] },
        { name: 'Peristyle Square & Cathedral', searchQuery: 'Peristyle, Split, Croatia', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Kotor',
      searchQuery: 'Kotor, Montenegro',
      minDays: 1, idealDays: 2, priority: 1,
      attractions: [
        { name: 'Kotor Old Town & Venetian Walls', searchQuery: 'Kotor Old Town, Montenegro', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Hike to Kotor Fortress', searchQuery: 'Kotor Fortress, Montenegro', category: 'viewpoint', vibes: ['nature', 'budget'] },
        { name: 'Our Lady of the Rocks (island church)', searchQuery: 'Our Lady of the Rocks, Montenegro', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Perast Village & Bay of Kotor', searchQuery: 'Perast, Montenegro', category: 'attraction', vibes: ['history'] },
      ],
    },
    {
      name: 'Sarajevo',
      searchQuery: 'Sarajevo, Bosnia and Herzegovina',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Baščaršija (Ottoman bazaar)', searchQuery: 'Baščaršija, Sarajevo, Bosnia', category: 'attraction', vibes: ['history', 'food', 'budget'], mustSee: true },
        { name: 'War Tunnel Museum (1992-95 siege)', searchQuery: 'Tunnel Museum, Sarajevo, Bosnia', category: 'museum', vibes: ['history'] },
        { name: 'Latin Bridge (Archduke assassination site)', searchQuery: 'Latin Bridge, Sarajevo, Bosnia', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Gazi Husrev-beg Mosque & Courtyard', searchQuery: 'Gazi Husrev-beg Mosque, Sarajevo', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Vrelo Bosne Nature Park', searchQuery: 'Vrelo Bosne, Sarajevo, Bosnia', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Mostar',
      searchQuery: 'Mostar, Bosnia and Herzegovina',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Stari Most (Old Bridge, UNESCO)', searchQuery: 'Stari Most, Mostar, Bosnia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Kujundžiluk Bazaar (coppersmiths street)', searchQuery: 'Kujundžiluk, Mostar, Bosnia', category: 'attraction', vibes: ['history', 'food', 'budget'] },
        { name: 'Blagaj Tekke (Dervish monastery)', searchQuery: 'Blagaj, Mostar, Bosnia', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Kajtaz House (Ottoman house museum)', searchQuery: 'Kajtaz House, Mostar, Bosnia', category: 'museum', vibes: ['history'] },
      ],
    },
    {
      name: 'Tirana',
      searchQuery: 'Tirana, Albania',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Skanderbeg Square', searchQuery: 'Skanderbeg Square, Tirana, Albania', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Blloku District (cafés & street art)', searchQuery: 'Blloku, Tirana, Albania', category: 'attraction', vibes: ['food', 'nightlife', 'history'] },
        { name: 'Bunk\'Art 1 & 2 (bunker museums)', searchQuery: 'Bunk Art, Tirana, Albania', category: 'museum', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Berat',
      searchQuery: 'Berat, Albania',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Berat Castle (Kala Quarter)', searchQuery: 'Berat Castle, Albania', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Mangalem & Gorica Neighbourhoods', searchQuery: 'Mangalem, Berat, Albania', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Ohrid',
      searchQuery: 'Ohrid, North Macedonia',
      minDays: 1, idealDays: 2, priority: 3,
      attractions: [
        { name: 'Ohrid Old Town & Samuil Fortress', searchQuery: 'Ohrid Old Town, North Macedonia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Lake Ohrid Swimming & Boat Tour', searchQuery: 'Lake Ohrid, North Macedonia', category: 'beach', vibes: ['beach', 'nature', 'budget'] },
        { name: 'Church of St John at Kaneo (cliff-top)', searchQuery: 'Church of St John Kaneo, Ohrid', category: 'attraction', vibes: ['history', 'budget'] },
      ],
    },
  ],

  // ── Indonesia ─────────────────────────────────────────────────────────────
  'indonesia': [
    {
      name: 'Bali',
      searchQuery: 'Bali, Indonesia',
      minDays: 3, idealDays: 7, priority: 1,
      attractions: [
        { name: 'Tanah Lot Temple at Sunset', searchQuery: 'Tanah Lot, Bali, Indonesia', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Tegallalang Rice Terraces (Ubud)', searchQuery: 'Tegallalang Rice Terraces, Ubud, Bali', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Uluwatu Cliff Temple & Kecak Dance', searchQuery: 'Uluwatu Temple, Bali, Indonesia', category: 'viewpoint', vibes: ['history', 'nature'] },
        { name: 'Seminyak Beach & Sunset Strip', searchQuery: 'Seminyak Beach, Bali, Indonesia', category: 'beach', vibes: ['beach', 'nightlife'] },
        { name: 'Ubud Monkey Forest', searchQuery: 'Sacred Monkey Forest Sanctuary, Ubud, Bali', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Mount Batur Sunrise Hike', searchQuery: 'Mount Batur, Bali, Indonesia', category: 'mountain', vibes: ['nature'] },
        { name: 'Nusa Penida Island (Kelingking Beach)', searchQuery: 'Nusa Penida, Bali, Indonesia', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Jimbaran Seafood Beach Dinner', searchQuery: 'Jimbaran Beach, Bali, Indonesia', category: 'restaurant', vibes: ['food', 'beach'] },
        { name: 'Ubud Art Market & Palaces', searchQuery: 'Ubud Market, Bali, Indonesia', category: 'restaurant', vibes: ['history', 'budget', 'food'] },
        { name: 'Tirta Empul Holy Spring Temple', searchQuery: 'Tirta Empul Temple, Tampaksiring, Bali', category: 'attraction', vibes: ['history'] },
      ],
    },
    {
      name: 'Yogyakarta',
      searchQuery: 'Yogyakarta, Indonesia',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Borobudur Temple at Sunrise (Buddhist)', searchQuery: 'Borobudur Temple, Yogyakarta, Indonesia', category: 'attraction', vibes: ['history', 'nature'], mustSee: true },
        { name: 'Prambanan Hindu Temple Complex', searchQuery: 'Prambanan, Yogyakarta, Indonesia', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Kraton (Sultan\'s Palace)', searchQuery: 'Kraton, Yogyakarta, Indonesia', category: 'museum', vibes: ['history'] },
        { name: 'Malioboro Street (batik & street food)', searchQuery: 'Malioboro Street, Yogyakarta, Indonesia', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Mount Merapi Volcano View', searchQuery: 'Mount Merapi, Yogyakarta, Indonesia', category: 'viewpoint', vibes: ['nature'] },
      ],
    },
    {
      name: 'Komodo Island',
      searchQuery: 'Komodo Island, Indonesia',
      minDays: 1, idealDays: 2, priority: 2,
      attractions: [
        { name: 'Komodo Dragon Trek', searchQuery: 'Komodo National Park, Indonesia', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Pink Beach Snorkelling', searchQuery: 'Pink Beach, Komodo, Indonesia', category: 'beach', vibes: ['beach', 'nature'] },
      ],
    },
    {
      name: 'Lombok',
      searchQuery: 'Lombok, Indonesia',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Gili Trawangan Island (snorkel & party)', searchQuery: 'Gili Trawangan, Lombok, Indonesia', category: 'beach', vibes: ['beach', 'nightlife'], mustSee: true },
        { name: 'Gili Air (relaxed & quiet island)', searchQuery: 'Gili Air, Lombok, Indonesia', category: 'beach', vibes: ['beach'] },
        { name: 'Kuta Lombok Surf Beach', searchQuery: 'Kuta Beach, Lombok, Indonesia', category: 'beach', vibes: ['beach', 'nature'] },
        { name: 'Mount Rinjani Base Camp Trek', searchQuery: 'Mount Rinjani, Lombok, Indonesia', category: 'mountain', vibes: ['nature'] },
      ],
    },
    {
      name: 'Jakarta',
      searchQuery: 'Jakarta, Indonesia',
      minDays: 1, idealDays: 1, priority: 3,
      attractions: [
        { name: 'Kota Tua (Old Batavia)', searchQuery: 'Kota Tua, Jakarta, Indonesia', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'National Museum of Indonesia', searchQuery: 'National Museum, Jakarta, Indonesia', category: 'museum', vibes: ['history', 'budget'] },
      ],
    },
  ],

  // ── India ─────────────────────────────────────────────────────────────────
  'india': [
    {
      name: 'Delhi',
      searchQuery: 'New Delhi, India',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Red Fort (Lal Qila)', searchQuery: 'Red Fort, Delhi, India', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Qutub Minar Complex', searchQuery: 'Qutub Minar, Delhi, India', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Chandni Chowk Market & Street Food', searchQuery: 'Chandni Chowk, Delhi, India', category: 'restaurant', vibes: ['food', 'history', 'budget'] },
        { name: 'Humayun\'s Tomb', searchQuery: "Humayun's Tomb, Delhi, India", category: 'attraction', vibes: ['history'] },
        { name: 'Lodi Garden (ancient tombs)', searchQuery: 'Lodi Garden, Delhi, India', category: 'park', vibes: ['nature', 'history', 'budget'] },
        { name: 'India Gate & Rajpath', searchQuery: 'India Gate, New Delhi, India', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Karim\'s Restaurant (Mughal cuisine)', searchQuery: "Karim's Hotel, Jama Masjid, Delhi, India", category: 'restaurant', vibes: ['food'] },
      ],
    },
    {
      name: 'Agra',
      searchQuery: 'Agra, India',
      minDays: 1, idealDays: 2, priority: 1,
      attractions: [
        { name: 'Taj Mahal at Sunrise', searchQuery: 'Taj Mahal, Agra, India', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Agra Fort', searchQuery: 'Agra Fort, Agra, India', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Itmad-ud-Daulah Tomb (Baby Taj)', searchQuery: 'Itmad-ud-Daulah, Agra, India', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Fatehpur Sikri (Mughal ghost city)', searchQuery: 'Fatehpur Sikri, Agra, India', category: 'attraction', vibes: ['history'] },
      ],
    },
    {
      name: 'Jaipur',
      searchQuery: 'Jaipur, India',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Amber (Amer) Palace & Fort', searchQuery: 'Amer Palace, Jaipur, India', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Hawa Mahal (Palace of Winds)', searchQuery: 'Hawa Mahal, Jaipur, India', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'City Palace Museum', searchQuery: 'City Palace, Jaipur, India', category: 'museum', vibes: ['history'] },
        { name: 'Jantar Mantar (astronomical observatory)', searchQuery: 'Jantar Mantar, Jaipur, India', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Johari Bazaar Market (gems & textiles)', searchQuery: 'Johari Bazaar, Jaipur, India', category: 'restaurant', vibes: ['food', 'history', 'budget'] },
        { name: 'Nahargarh Fort Viewpoint', searchQuery: 'Nahargarh Fort, Jaipur, India', category: 'viewpoint', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Varanasi',
      searchQuery: 'Varanasi, India',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Dashashwamedh Ghat (Ganga Aarti Ceremony)', searchQuery: 'Dashashwamedh Ghat, Varanasi, India', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Boat Ride on the Ganges at Sunrise', searchQuery: 'Ganges River, Varanasi, India', category: 'park', vibes: ['history', 'nature'] },
        { name: 'Sarnath (Buddha\'s first sermon site)', searchQuery: 'Sarnath, Varanasi, India', category: 'museum', vibes: ['history'] },
        { name: 'Ghats Walking Tour', searchQuery: 'Ghats of Varanasi, India', category: 'attraction', vibes: ['history', 'budget'] },
        { name: 'Blue Lassi (famous yoghurt shop)', searchQuery: 'Blue Lassi, Varanasi, India', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Mumbai',
      searchQuery: 'Mumbai, India',
      minDays: 2, idealDays: 3, priority: 2,
      attractions: [
        { name: 'Gateway of India', searchQuery: 'Gateway of India, Mumbai, India', category: 'attraction', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Dharavi Slum & Pottery Quarter', searchQuery: 'Dharavi, Mumbai, India', category: 'attraction', vibes: ['history'] },
        { name: 'Colaba Causeway (cafés & bars)', searchQuery: 'Colaba, Mumbai, India', category: 'restaurant', vibes: ['food', 'nightlife', 'history'] },
        { name: 'Elephanta Caves (ferry trip)', searchQuery: 'Elephanta Caves, Mumbai, India', category: 'museum', vibes: ['history'] },
        { name: 'Marine Drive at Sunset', searchQuery: 'Marine Drive, Mumbai, India', category: 'viewpoint', vibes: ['budget', 'nature'] },
        { name: 'Crawford Market & Street Food', searchQuery: 'Crawford Market, Mumbai, India', category: 'restaurant', vibes: ['food', 'budget'] },
      ],
    },
    {
      name: 'Goa',
      searchQuery: 'Goa, India',
      minDays: 2, idealDays: 4, priority: 2,
      attractions: [
        { name: 'Palolem Beach (south Goa, relaxed)', searchQuery: 'Palolem Beach, South Goa, India', category: 'beach', vibes: ['beach'], mustSee: true },
        { name: 'Basilica of Bom Jesus (Old Goa)', searchQuery: 'Basilica of Bom Jesus, Goa, India', category: 'attraction', vibes: ['history'] },
        { name: 'Anjuna Market & Flea Market', searchQuery: 'Anjuna Market, Goa, India', category: 'restaurant', vibes: ['food', 'budget', 'nightlife'] },
        { name: 'Baga & Calangute Beach (north Goa)', searchQuery: 'Baga Beach, North Goa, India', category: 'beach', vibes: ['beach', 'nightlife'] },
        { name: 'Dudhsagar Waterfalls Trek', searchQuery: 'Dudhsagar Falls, Goa, India', category: 'park', vibes: ['nature'] },
      ],
    },
    {
      name: 'Kerala',
      searchQuery: 'Kochi, Kerala, India',
      minDays: 2, idealDays: 4, priority: 3,
      attractions: [
        { name: 'Alleppey Houseboat on Backwaters', searchQuery: 'Alleppey Backwaters, Kerala, India', category: 'park', vibes: ['nature', 'beach'], mustSee: true },
        { name: 'Fort Kochi & Chinese Fishing Nets', searchQuery: 'Fort Kochi, Kerala, India', category: 'attraction', vibes: ['history', 'food', 'budget'] },
        { name: 'Munnar Tea Plantations', searchQuery: 'Munnar Tea Gardens, Kerala, India', category: 'park', vibes: ['nature'] },
        { name: 'Kerala Kathakali Dance Show', searchQuery: 'Kathakali, Kochi, Kerala, India', category: 'attraction', vibes: ['history'] },
        { name: 'Varkala Cliff Beach', searchQuery: 'Varkala Beach, Kerala, India', category: 'beach', vibes: ['beach', 'nature'] },
      ],
    },
  ],

  // ── Nepal ─────────────────────────────────────────────────────────────────
  'nepal': [
    {
      name: 'Kathmandu',
      searchQuery: 'Kathmandu, Nepal',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Swayambhunath (Monkey Temple)', searchQuery: 'Swayambhunath, Kathmandu, Nepal', category: 'viewpoint', vibes: ['history', 'budget'], mustSee: true },
        { name: 'Boudhanath Stupa (UNESCO)', searchQuery: 'Boudhanath Stupa, Kathmandu, Nepal', category: 'attraction', vibes: ['history'], mustSee: true },
        { name: 'Pashupatinath Temple & Cremation Ghats', searchQuery: 'Pashupatinath Temple, Kathmandu, Nepal', category: 'attraction', vibes: ['history'] },
        { name: 'Thamel Neighbourhood (gear & food)', searchQuery: 'Thamel, Kathmandu, Nepal', category: 'restaurant', vibes: ['food', 'budget'] },
        { name: 'Patan Durbar Square', searchQuery: 'Patan Durbar Square, Kathmandu, Nepal', category: 'museum', vibes: ['history', 'budget'] },
      ],
    },
    {
      name: 'Pokhara',
      searchQuery: 'Pokhara, Nepal',
      minDays: 2, idealDays: 3, priority: 1,
      attractions: [
        { name: 'Sarangkot Sunrise (Annapurna panorama)', searchQuery: 'Sarangkot, Pokhara, Nepal', category: 'viewpoint', vibes: ['nature'], mustSee: true },
        { name: 'Phewa Lake Rowboat', searchQuery: 'Phewa Lake, Pokhara, Nepal', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'World Peace Pagoda', searchQuery: 'World Peace Pagoda, Pokhara, Nepal', category: 'viewpoint', vibes: ['history', 'nature', 'budget'] },
        { name: 'Paragliding over Pokhara Valley', searchQuery: 'paragliding Pokhara, Nepal', category: 'park', vibes: ['nature'] },
        { name: 'Davis Falls & Gupteshwor Cave', searchQuery: 'Davis Falls, Pokhara, Nepal', category: 'park', vibes: ['nature', 'budget'] },
      ],
    },
    {
      name: 'Annapurna',
      searchQuery: 'Annapurna Base Camp, Nepal',
      minDays: 3, idealDays: 7, priority: 2,
      attractions: [
        { name: 'Poon Hill Trek (sunrise over Annapurna)', searchQuery: 'Poon Hill, Ghorepani, Nepal', category: 'viewpoint', vibes: ['nature'], mustSee: true },
        { name: 'Ghandruk Village & Culture', searchQuery: 'Ghandruk, Annapurna, Nepal', category: 'attraction', vibes: ['history', 'nature'] },
        { name: 'Annapurna Base Camp Trail', searchQuery: 'Annapurna Base Camp trek, Nepal', category: 'mountain', vibes: ['nature'] },
      ],
    },
    {
      name: 'Chitwan',
      searchQuery: 'Chitwan National Park, Nepal',
      minDays: 2, idealDays: 3, priority: 3,
      attractions: [
        { name: 'Jungle Safari (rhino & elephant spotting)', searchQuery: 'Chitwan National Park safari, Nepal', category: 'park', vibes: ['nature'], mustSee: true },
        { name: 'Canoe Ride on Rapti River', searchQuery: 'Rapti River, Chitwan, Nepal', category: 'park', vibes: ['nature', 'budget'] },
        { name: 'Tharu Cultural Dance Show', searchQuery: 'Tharu cultural program, Chitwan, Nepal', category: 'attraction', vibes: ['history'] },
      ],
    },
  ],
};

// ── Matching ─────────────────────────────────────────────────────────────────

function matchDestination(destination: string): string | null {
  const lower = destination.toLowerCase().trim();
  if (DESTINATION_KNOWLEDGE[lower]) return lower;
  for (const key of Object.keys(DESTINATION_KNOWLEDGE)) {
    if (lower.includes(key) || key.includes(lower)) return key;
  }
  return null;
}

// ── Distribution algorithm ────────────────────────────────────────────────────

export function buildItineraryStops(
  destination: string,
  totalDays: number
): ItineraryStop[] {
  const key = matchDestination(destination);
  if (!key) return [];

  const allStops = DESTINATION_KNOWLEDGE[key];

  let maxPriority: 1 | 2 | 3;
  if (totalDays < 7) maxPriority = 1;
  else if (totalDays < 14) maxPriority = 2;
  else maxPriority = 3;

  const eligible = allStops.filter((s) => s.priority <= maxPriority);

  let candidates = [...eligible];
  while (
    candidates.length > 1 &&
    candidates.reduce((s, c) => s + c.minDays, 0) > totalDays
  ) {
    const maxP = Math.max(...candidates.map((c) => c.priority));
    const idx = candidates.map((c) => c.priority).lastIndexOf(maxP as 1 | 2 | 3);
    candidates.splice(idx, 1);
  }

  if (candidates.length === 0) return [];

  const idealTotal = candidates.reduce((s, c) => s + c.idealDays, 0);
  const scale = totalDays / idealTotal;

  const raw = candidates.map((stop) => ({
    ...stop,
    assignedDays: Math.max(stop.minDays, Math.round(stop.idealDays * scale)),
  }));

  let current = raw.reduce((s, r) => s + r.assignedDays, 0);
  let iterations = 0;

  while (current !== totalDays && iterations < 50) {
    iterations++;
    const diff = totalDays - current;
    if (diff > 0) {
      const idx = raw
        .map((r, i) => ({ i, room: r.idealDays - r.assignedDays }))
        .sort((a, b) => b.room - a.room)[0].i;
      raw[idx].assignedDays += 1;
    } else {
      const idx = raw
        .map((r, i) => ({ i, surplus: r.assignedDays - r.minDays }))
        .filter((x) => x.surplus > 0)
        .sort((a, b) => b.surplus - a.surplus)[0]?.i;
      if (idx === undefined) break;
      raw[idx].assignedDays -= 1;
    }
    current = raw.reduce((s, r) => s + r.assignedDays, 0);
  }

  let dayOffset = 1;
  return raw.map((stop) => {
    const result: ItineraryStop = { ...stop, startDay: dayOffset };
    dayOffset += stop.assignedDays;
    return result;
  });
}

export function isKnownDestination(destination: string): boolean {
  return matchDestination(destination) !== null;
}
