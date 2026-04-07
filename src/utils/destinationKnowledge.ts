/**
 * Destination knowledge base for the Dashboard Wizard skeleton generation.
 * Maps destination keywords to ordered city/region stops with day allocation hints.
 */

export interface DestinationStop {
  name: string;
  /** Query string sent to Nominatim for geocoding */
  searchQuery: string;
  /** Minimum days to spend here — never cut below this */
  minDays: number;
  /** Preferred allocation when days are plentiful */
  idealDays: number;
  /**
   * 1 = must-see (always included)
   * 2 = great addition (included when days ≥ 7)
   * 3 = optional bonus (included when days ≥ 14)
   */
  priority: 1 | 2 | 3;
}

export interface ItineraryStop extends DestinationStop {
  /** Days assigned by the distributor */
  assignedDays: number;
  /** 1-based index of the first day in this stop's block */
  startDay: number;
}

// ── Knowledge base ────────────────────────────────────────────────────────────

const DESTINATION_KNOWLEDGE: Record<string, DestinationStop[]> = {
  'southeast asia': [
    { name: 'Bangkok',          searchQuery: 'Bangkok, Thailand',          minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Chiang Mai',       searchQuery: 'Chiang Mai, Thailand',        minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Siem Reap',        searchQuery: 'Siem Reap, Cambodia',         minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Hanoi',            searchQuery: 'Hanoi, Vietnam',              minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Hội An',           searchQuery: 'Hoi An, Vietnam',             minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Ho Chi Minh City', searchQuery: 'Ho Chi Minh City, Vietnam',   minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Bali',             searchQuery: 'Bali, Indonesia',             minDays: 3, idealDays: 5, priority: 2 },
    { name: 'Luang Prabang',    searchQuery: 'Luang Prabang, Laos',         minDays: 2, idealDays: 3, priority: 3 },
  ],

  'vietnam': [
    { name: 'Hanoi',            searchQuery: 'Hanoi, Vietnam',              minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Ha Long Bay',      searchQuery: 'Ha Long Bay, Vietnam',        minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Hội An',           searchQuery: 'Hoi An, Vietnam',             minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Da Nang',          searchQuery: 'Da Nang, Vietnam',            minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Ho Chi Minh City', searchQuery: 'Ho Chi Minh City, Vietnam',   minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Mekong Delta',     searchQuery: 'Mekong Delta, Vietnam',       minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Phú Quốc',         searchQuery: 'Phu Quoc Island, Vietnam',    minDays: 2, idealDays: 3, priority: 3 },
  ],

  'japan': [
    { name: 'Tokyo',            searchQuery: 'Tokyo, Japan',                minDays: 3, idealDays: 5, priority: 1 },
    { name: 'Hakone',           searchQuery: 'Hakone, Kanagawa, Japan',     minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Kyoto',            searchQuery: 'Kyoto, Japan',                minDays: 3, idealDays: 4, priority: 1 },
    { name: 'Nara',             searchQuery: 'Nara, Japan',                 minDays: 1, idealDays: 1, priority: 2 },
    { name: 'Osaka',            searchQuery: 'Osaka, Japan',                minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Hiroshima',        searchQuery: 'Hiroshima, Japan',            minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Kanazawa',         searchQuery: 'Kanazawa, Japan',             minDays: 1, idealDays: 2, priority: 3 },
  ],

  'thailand': [
    { name: 'Bangkok',          searchQuery: 'Bangkok, Thailand',           minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Chiang Mai',       searchQuery: 'Chiang Mai, Thailand',        minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Chiang Rai',       searchQuery: 'Chiang Rai, Thailand',        minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Pai',              searchQuery: 'Pai, Mae Hong Son, Thailand', minDays: 2, idealDays: 3, priority: 3 },
    { name: 'Ko Samui',         searchQuery: 'Ko Samui, Thailand',          minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Krabi',            searchQuery: 'Krabi, Thailand',             minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Koh Lanta',        searchQuery: 'Ko Lanta, Krabi, Thailand',   minDays: 2, idealDays: 3, priority: 3 },
  ],

  'balkans': [
    { name: 'Dubrovnik',        searchQuery: 'Dubrovnik, Croatia',          minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Split',            searchQuery: 'Split, Croatia',              minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Kotor',            searchQuery: 'Kotor, Montenegro',           minDays: 1, idealDays: 2, priority: 1 },
    { name: 'Sarajevo',         searchQuery: 'Sarajevo, Bosnia and Herzegovina', minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Mostar',           searchQuery: 'Mostar, Bosnia and Herzegovina',   minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Tirana',           searchQuery: 'Tirana, Albania',             minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Berat',            searchQuery: 'Berat, Albania',              minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Ohrid',            searchQuery: 'Ohrid, North Macedonia',      minDays: 1, idealDays: 2, priority: 3 },
  ],

  'morocco': [
    { name: 'Marrakech',        searchQuery: 'Marrakech, Morocco',          minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Chefchaouen',      searchQuery: 'Chefchaouen, Morocco',        minDays: 1, idealDays: 2, priority: 1 },
    { name: 'Fes',              searchQuery: 'Fes, Morocco',                minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Merzouga',         searchQuery: 'Merzouga, Morocco',           minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Essaouira',        searchQuery: 'Essaouira, Morocco',          minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Casablanca',       searchQuery: 'Casablanca, Morocco',         minDays: 1, idealDays: 1, priority: 3 },
  ],

  'south america': [
    { name: 'Cartagena',        searchQuery: 'Cartagena, Colombia',         minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Medellín',         searchQuery: 'Medellin, Colombia',          minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Lima',             searchQuery: 'Lima, Peru',                  minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Cusco',            searchQuery: 'Cusco, Peru',                 minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Machu Picchu',     searchQuery: 'Machu Picchu, Peru',          minDays: 1, idealDays: 2, priority: 1 },
    { name: 'Buenos Aires',     searchQuery: 'Buenos Aires, Argentina',     minDays: 2, idealDays: 4, priority: 2 },
    { name: 'Patagonia',        searchQuery: 'El Calafate, Argentina',      minDays: 2, idealDays: 4, priority: 3 },
  ],

  'indonesia': [
    { name: 'Bali',             searchQuery: 'Bali, Indonesia',             minDays: 3, idealDays: 7, priority: 1 },
    { name: 'Yogyakarta',       searchQuery: 'Yogyakarta, Indonesia',       minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Komodo Island',    searchQuery: 'Komodo Island, Indonesia',    minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Lombok',           searchQuery: 'Lombok, Indonesia',           minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Jakarta',          searchQuery: 'Jakarta, Indonesia',          minDays: 1, idealDays: 1, priority: 3 },
  ],

  'india': [
    { name: 'Delhi',            searchQuery: 'New Delhi, India',            minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Agra',             searchQuery: 'Agra, India',                 minDays: 1, idealDays: 2, priority: 1 },
    { name: 'Jaipur',           searchQuery: 'Jaipur, India',               minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Varanasi',         searchQuery: 'Varanasi, India',             minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Mumbai',           searchQuery: 'Mumbai, India',               minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Goa',              searchQuery: 'Goa, India',                  minDays: 2, idealDays: 4, priority: 2 },
    { name: 'Kerala',           searchQuery: 'Kochi, Kerala, India',        minDays: 2, idealDays: 4, priority: 3 },
  ],

  'nepal': [
    { name: 'Kathmandu',        searchQuery: 'Kathmandu, Nepal',            minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Pokhara',          searchQuery: 'Pokhara, Nepal',              minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Annapurna',        searchQuery: 'Annapurna Base Camp, Nepal',  minDays: 3, idealDays: 7, priority: 2 },
    { name: 'Chitwan',          searchQuery: 'Chitwan National Park, Nepal', minDays: 2, idealDays: 3, priority: 3 },
  ],

  'colombia': [
    { name: 'Cartagena',        searchQuery: 'Cartagena, Colombia',         minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Medellín',         searchQuery: 'Medellin, Colombia',          minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Bogotá',           searchQuery: 'Bogota, Colombia',            minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Coffee Region',    searchQuery: 'Salento, Quindio, Colombia',  minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Santa Marta',      searchQuery: 'Santa Marta, Colombia',       minDays: 2, idealDays: 3, priority: 3 },
  ],

  'peru': [
    { name: 'Lima',             searchQuery: 'Lima, Peru',                  minDays: 1, idealDays: 2, priority: 1 },
    { name: 'Cusco',            searchQuery: 'Cusco, Peru',                 minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Machu Picchu',     searchQuery: 'Machu Picchu, Peru',          minDays: 1, idealDays: 2, priority: 1 },
    { name: 'Sacred Valley',    searchQuery: 'Pisac, Cusco, Peru',          minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Lake Titicaca',    searchQuery: 'Puno, Peru',                  minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Arequipa',         searchQuery: 'Arequipa, Peru',              minDays: 1, idealDays: 2, priority: 3 },
  ],

  'italy': [
    { name: 'Rome',             searchQuery: 'Rome, Italy',                 minDays: 3, idealDays: 4, priority: 1 },
    { name: 'Florence',         searchQuery: 'Florence, Italy',             minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Venice',           searchQuery: 'Venice, Italy',               minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Cinque Terre',     searchQuery: 'Cinque Terre, Italy',         minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Amalfi Coast',     searchQuery: 'Amalfi, Salerno, Italy',      minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Sicily',           searchQuery: 'Palermo, Sicily, Italy',      minDays: 2, idealDays: 4, priority: 3 },
  ],

  'spain': [
    { name: 'Madrid',           searchQuery: 'Madrid, Spain',               minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Barcelona',        searchQuery: 'Barcelona, Spain',            minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Seville',          searchQuery: 'Seville, Spain',              minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Granada',          searchQuery: 'Granada, Spain',              minDays: 1, idealDays: 2, priority: 2 },
    { name: 'San Sebastián',    searchQuery: 'San Sebastian, Spain',        minDays: 1, idealDays: 2, priority: 2 },
    { name: 'Valencia',         searchQuery: 'Valencia, Spain',             minDays: 1, idealDays: 2, priority: 3 },
  ],

  'portugal': [
    { name: 'Lisbon',           searchQuery: 'Lisbon, Portugal',            minDays: 2, idealDays: 4, priority: 1 },
    { name: 'Porto',            searchQuery: 'Porto, Portugal',             minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Sintra',           searchQuery: 'Sintra, Portugal',            minDays: 1, idealDays: 1, priority: 2 },
    { name: 'Algarve',          searchQuery: 'Lagos, Algarve, Portugal',    minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Évora',            searchQuery: 'Évora, Portugal',             minDays: 1, idealDays: 1, priority: 3 },
  ],

  'greece': [
    { name: 'Athens',           searchQuery: 'Athens, Greece',              minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Santorini',        searchQuery: 'Santorini, Greece',           minDays: 2, idealDays: 3, priority: 1 },
    { name: 'Mykonos',          searchQuery: 'Mykonos, Greece',             minDays: 2, idealDays: 3, priority: 2 },
    { name: 'Crete',            searchQuery: 'Heraklion, Crete, Greece',    minDays: 2, idealDays: 4, priority: 2 },
    { name: 'Meteora',          searchQuery: 'Meteora, Kalampaka, Greece',  minDays: 1, idealDays: 2, priority: 3 },
    { name: 'Rhodes',           searchQuery: 'Rhodes, Greece',              minDays: 2, idealDays: 3, priority: 3 },
  ],
};

// ── Matching ─────────────────────────────────────────────────────────────────

/**
 * Find the best matching knowledge-base key for a user destination string.
 * Returns null if no match found.
 */
function matchDestination(destination: string): string | null {
  const lower = destination.toLowerCase().trim();
  // Exact match first
  if (DESTINATION_KNOWLEDGE[lower]) return lower;
  // Partial match — user typed "Vietnam" → key "vietnam"
  for (const key of Object.keys(DESTINATION_KNOWLEDGE)) {
    if (lower.includes(key) || key.includes(lower)) return key;
  }
  return null;
}

// ── Distribution algorithm ────────────────────────────────────────────────────

/**
 * Build an itinerary stop list for a given destination and total days.
 * Returns an empty array if the destination is not in the knowledge base.
 */
export function buildItineraryStops(
  destination: string,
  totalDays: number
): ItineraryStop[] {
  const key = matchDestination(destination);
  if (!key) return [];

  const allStops = DESTINATION_KNOWLEDGE[key];

  // 1. Filter by priority based on available days
  let maxPriority: 1 | 2 | 3;
  if (totalDays < 7) maxPriority = 1;
  else if (totalDays < 14) maxPriority = 2;
  else maxPriority = 3;

  const eligible = allStops.filter((s) => s.priority <= maxPriority);

  // 2. Check if minDays sum fits; if not, drop lowest-priority stops
  let candidates = [...eligible];
  while (
    candidates.length > 1 &&
    candidates.reduce((s, c) => s + c.minDays, 0) > totalDays
  ) {
    // Remove highest-priority-number (least important) stop
    const maxP = Math.max(...candidates.map((c) => c.priority));
    const idx = candidates.map((c) => c.priority).lastIndexOf(maxP as 1 | 2 | 3);
    candidates.splice(idx, 1);
  }

  if (candidates.length === 0) return [];

  // 3. Proportional scaling
  const idealTotal = candidates.reduce((s, c) => s + c.idealDays, 0);
  const scale = totalDays / idealTotal;

  // Initial scaled allocation respecting minDays
  const raw = candidates.map((stop) => ({
    ...stop,
    assignedDays: Math.max(stop.minDays, Math.round(stop.idealDays * scale)),
  }));

  // 4. Adjust to hit exactly totalDays
  let current = raw.reduce((s, r) => s + r.assignedDays, 0);
  let iterations = 0;

  while (current !== totalDays && iterations < 50) {
    iterations++;
    const diff = totalDays - current;
    if (diff > 0) {
      // Need more days — add to stop with most room above minDays that has the most idealDays
      const idx = raw
        .map((r, i) => ({ i, room: r.idealDays - r.assignedDays }))
        .sort((a, b) => b.room - a.room)[0].i;
      raw[idx].assignedDays += 1;
    } else {
      // Need fewer days — remove from stop with most room above minDays
      const idx = raw
        .map((r, i) => ({ i, surplus: r.assignedDays - r.minDays }))
        .filter((x) => x.surplus > 0)
        .sort((a, b) => b.surplus - a.surplus)[0]?.i;
      if (idx === undefined) break;
      raw[idx].assignedDays -= 1;
    }
    current = raw.reduce((s, r) => s + r.assignedDays, 0);
  }

  // 5. Assign startDay offsets
  let dayOffset = 1;
  return raw.map((stop) => {
    const result: ItineraryStop = { ...stop, startDay: dayOffset };
    dayOffset += stop.assignedDays;
    return result;
  });
}

/**
 * Returns true if the destination has an entry in the knowledge base.
 */
export function isKnownDestination(destination: string): boolean {
  return matchDestination(destination) !== null;
}
