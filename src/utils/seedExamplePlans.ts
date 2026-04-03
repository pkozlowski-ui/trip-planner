/**
 * Seed 6 example trip plans with days and locations (popular recommendations).
 * Use programmatically (e.g. from browser console) or "Add 6 example plans".
 */

import {
  createTripPlan,
  createDay,
  createLocation,
  getTripPlans,
  getTripPlan,
  deleteTripPlan,
  updateTripPlan,
  updateLocation,
  refreshPlanCover,
} from '../services/firebase/firestore';
import type { LocationCategory } from '../types';

type LocInput = {
  name: string;
  category: LocationCategory;
  coordinates: { lat: number; lng: number };
  description?: string;
  duration?: string;
  openingHours?: string;
  rating?: number;
  order: number;
};

async function createPlanWithDaysAndLocations(
  userId: string,
  title: string,
  description: string,
  startDate: Date,
  days: LocInput[][]
): Promise<string> {
  const planId = await createTripPlan(userId, {
    title,
    description,
    startDate,
    endDate: new Date(startDate.getTime() + (days.length - 1) * 24 * 60 * 60 * 1000),
    mapStyle: 'minimal',
    isPublic: false,
  });
  const dayIds: string[] = [];
  for (let d = 0; d < days.length; d++) {
    const dayDate = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
    const dayId = await createDay(planId, { dayNumber: d + 1, date: dayDate });
    dayIds.push(dayId);
  }
  for (let d = 0; d < days.length; d++) {
    const locs = days[d];
    for (let i = 0; i < locs.length; i++) {
      const loc = locs[i];
      await createLocation(planId, dayIds[d], {
        name: loc.name,
        category: loc.category,
        coordinates: loc.coordinates,
        description: loc.description,
        duration: loc.duration,
        openingHours: loc.openingHours,
        rating: loc.rating,
        order: loc.order,
        media: [],
      });
    }
  }
  await refreshPlanCover(planId);
  return planId;
}

const BASE_DATE = new Date('2025-05-01');

/**
 * Create 6 example trip plans. Returns created plan IDs.
 * Does nothing if the user already has any plans (avoids duplicates on remount/re-run).
 */
export async function createExamplePlans(userId: string): Promise<string[]> {
  const existing = await getTripPlans(userId);
  if (existing.length > 0) {
    return []; // User already has plans – do not seed again
  }
  const ids: string[] = [];

  // 1. Rome: classic highlights (3 days)
  ids.push(
    await createPlanWithDaysAndLocations(
      userId,
      'Rome: classic highlights',
      'Classic Rome landmarks (sample data).',
      new Date(BASE_DATE),
      [
        [
          {
            name: 'Colosseum',
            category: 'attraction',
            coordinates: { lat: 41.8902, lng: 12.4922 },
            description: 'Flavian Amphitheatre, symbol of Rome.',
            duration: '2h',
            openingHours: '9:00-19:00',
            rating: 4.8,
            order: 1,
          },
          {
            name: 'Forum Romanum',
            category: 'attraction',
            coordinates: { lat: 41.8925, lng: 12.4863 },
            description: 'Remains of ancient Rome\'s centre.',
            duration: '2h',
            rating: 4.7,
            order: 2,
          },
          {
            name: 'Trevi Fountain',
            category: 'attraction',
            coordinates: { lat: 41.9009, lng: 12.4833 },
            description: 'Baroque fountain, coin-throwing tradition.',
            duration: '45m',
            rating: 4.6,
            order: 3,
          },
        ],
        [
          {
            name: 'Pantheon',
            category: 'attraction',
            coordinates: { lat: 41.8986, lng: 12.4769 },
            description: 'Temple of all gods, dome with oculus.',
            duration: '1h',
            openingHours: '9:00-19:00',
            rating: 4.8,
            order: 1,
          },
          {
            name: 'Spanish Steps',
            category: 'attraction',
            coordinates: { lat: 41.9058, lng: 12.4823 },
            description: 'Famous steps and square by Barcaccia fountain.',
            duration: '1h',
            rating: 4.5,
            order: 2,
          },
        ],
        [
          {
            name: 'St. Peter\'s Basilica',
            category: 'attraction',
            coordinates: { lat: 41.9022, lng: 12.4534 },
            description: 'Main Vatican church, Michelangelo\'s dome.',
            duration: '2h',
            openingHours: '7:00-19:00',
            rating: 4.9,
            order: 1,
          },
          {
            name: 'Vatican Museums',
            category: 'museum',
            coordinates: { lat: 41.9065, lng: 12.4536 },
            description: 'Art collections, Sistine Chapel.',
            duration: '4h',
            openingHours: '9:00-18:00',
            rating: 4.8,
            order: 2,
          },
        ],
      ]
    )
  );

  // 2. Poznań: food and sights (2 days)
  const poznanStart = new Date(BASE_DATE.getTime() + 7 * 24 * 60 * 60 * 1000);
  ids.push(
    await createPlanWithDaysAndLocations(
      userId,
      'Poznań: food and sights',
      'Sights and recommended restaurants in Poznań (sample data).',
      poznanStart,
      [
        [
          {
            name: 'Town Hall and Old Market Square',
            category: 'attraction',
            coordinates: { lat: 52.4082, lng: 16.9341 },
            description: 'Renaissance town hall with billy goats.',
            duration: '1h',
            rating: 4.7,
            order: 1,
          },
          {
            name: 'Stary Browar',
            category: 'attraction',
            coordinates: { lat: 52.4064, lng: 16.9253 },
            description: 'Shopping and culture centre in a brewery.',
            duration: '2h',
            rating: 4.5,
            order: 2,
          },
          {
            name: 'Pod Pretekstem',
            category: 'restaurant',
            coordinates: { lat: 52.407, lng: 16.932 },
            description: 'City centre restaurant, Polish cuisine with a twist.',
            duration: '1h 30m',
            rating: 4.6,
            order: 3,
          },
        ],
        [
          {
            name: 'Poznań Cathedral',
            category: 'attraction',
            coordinates: { lat: 52.4115, lng: 16.9475 },
            description: 'Cathedral Island, birthplace of the Polish state.',
            duration: '1h',
            rating: 4.7,
            order: 1,
          },
          {
            name: 'Croissant Museum',
            category: 'museum',
            coordinates: { lat: 52.4074, lng: 16.9342 },
            description: 'St. Martin\'s croissant baking show.',
            duration: '1h',
            rating: 4.5,
            order: 2,
          },
          {
            name: 'Weranda',
            category: 'restaurant',
            coordinates: { lat: 52.408, lng: 16.935 },
            description: 'Restaurant with a view of the market square.',
            duration: '1h 30m',
            rating: 4.4,
            order: 3,
          },
        ],
      ]
    )
  );

  // 3. Berlin music trip (3 days)
  const berlinStart = new Date(BASE_DATE.getTime() + 14 * 24 * 60 * 60 * 1000);
  ids.push(
    await createPlanWithDaysAndLocations(
      userId,
      'Berlin music trip',
      'Music and culture spots in Berlin (sample data).',
      berlinStart,
      [
        [
          {
            name: 'East Side Gallery',
            category: 'attraction',
            coordinates: { lat: 52.5055, lng: 13.4536 },
            description: 'Section of the Berlin Wall with murals.',
            duration: '1h 30m',
            rating: 4.7,
            order: 1,
          },
          {
            name: 'Holzmarkt',
            category: 'attraction',
            coordinates: { lat: 52.5142, lng: 13.4242 },
            description: 'Culture and dining complex on the Spree.',
            duration: '2h',
            rating: 4.4,
            order: 2,
          },
          {
            name: 'Watergate',
            category: 'other',
            coordinates: { lat: 52.5014, lng: 13.443 },
            description: 'Music club on the banks of the Spree.',
            duration: 'evening',
            rating: 4.5,
            order: 3,
          },
        ],
        [
          {
            name: 'Philharmonie',
            category: 'attraction',
            coordinates: { lat: 52.51, lng: 13.3705 },
            description: 'Home of the Berlin Philharmonic.',
            duration: '2h',
            rating: 4.8,
            order: 1,
          },
          {
            name: 'David Bowie Memorial',
            category: 'attraction',
            coordinates: { lat: 52.505, lng: 13.439 },
            description: 'Mural and memorial to Bowie in Kreuzberg.',
            duration: '30m',
            rating: 4.5,
            order: 2,
          },
        ],
        [
          {
            name: 'Berghain / vicinity',
            category: 'other',
            coordinates: { lat: 52.5112, lng: 13.4392 },
            description: 'Icon of Berlin\'s club scene (exterior view).',
            duration: '1h',
            rating: 4.6,
            order: 1,
          },
          {
            name: 'RAW-Gelände',
            category: 'attraction',
            coordinates: { lat: 52.5065, lng: 13.448 },
            description: 'Culture area, street art, bars.',
            duration: '2h',
            rating: 4.4,
            order: 2,
          },
        ],
      ]
    )
  );

  // 4. Tokyo photo trip (4 days)
  const tokyoStart = new Date(BASE_DATE.getTime() + 21 * 24 * 60 * 60 * 1000);
  ids.push(
    await createPlanWithDaysAndLocations(
      userId,
      'Tokyo photo trip',
      'Best photo spots in Tokyo (sample data).',
      tokyoStart,
      [
        [
          {
            name: 'Sensō-ji',
            category: 'attraction',
            coordinates: { lat: 35.7148, lng: 139.7967 },
            description: 'Tokyo\'s oldest temple, in Asakusa.',
            duration: '2h',
            rating: 4.7,
            order: 1,
          },
          {
            name: 'Akihabara',
            category: 'attraction',
            coordinates: { lat: 35.6984, lng: 139.7731 },
            description: 'Electronics, manga and gaming district.',
            duration: '2h',
            rating: 4.5,
            order: 2,
          },
        ],
        [
          {
            name: 'Shibuya Crossing',
            category: 'viewpoint',
            coordinates: { lat: 35.6595, lng: 139.7004 },
            description: 'Famous crossing, best shots from above.',
            duration: '1h 30m',
            rating: 4.6,
            order: 1,
          },
          {
            name: 'Meiji Jingu',
            category: 'attraction',
            coordinates: { lat: 35.6764, lng: 139.6993 },
            description: 'Shinto shrine in the greenery of Yoyogi.',
            duration: '2h',
            rating: 4.7,
            order: 2,
          },
        ],
        [
          {
            name: 'teamLab Borderless',
            category: 'attraction',
            coordinates: { lat: 35.6302, lng: 139.7916 },
            description: 'Immersive digital art exhibition.',
            duration: '3h',
            openingHours: '10:00-19:00',
            rating: 4.8,
            order: 1,
          },
        ],
        [
          {
            name: 'Shinjuku',
            category: 'viewpoint',
            coordinates: { lat: 35.6896, lng: 139.6917 },
            description: 'Skyscrapers, neon streets, observatory views.',
            duration: '2h',
            rating: 4.6,
            order: 1,
          },
          {
            name: 'Yoyogi Park',
            category: 'park',
            coordinates: { lat: 35.6712, lng: 139.6969 },
            description: 'Park next to Meiji, ideal for photos.',
            duration: '1h 30m',
            rating: 4.5,
            order: 2,
          },
        ],
      ]
    )
  );

  // 5. Lake Garda (3 days)
  const gardaStart = new Date(BASE_DATE.getTime() + 28 * 24 * 60 * 60 * 1000);
  ids.push(
    await createPlanWithDaysAndLocations(
      userId,
      'Lake Garda',
      'Sirmione, Riva, Malcesine and surroundings (sample data).',
      gardaStart,
      [
        [
          {
            name: 'Sirmione – Scaliger Castle',
            category: 'attraction',
            coordinates: { lat: 45.4913, lng: 10.6059 },
            description: 'Castle on the Sirmione peninsula.',
            duration: '1h 30m',
            rating: 4.7,
            order: 1,
          },
          {
            name: 'Grotte di Catullo',
            category: 'attraction',
            coordinates: { lat: 45.4875, lng: 10.6072 },
            description: 'Roman villa ruins with lake views.',
            duration: '2h',
            rating: 4.6,
            order: 2,
          },
        ],
        [
          {
            name: 'Riva del Garda',
            category: 'city',
            coordinates: { lat: 45.885, lng: 10.8414 },
            description: 'Picturesque town at the northern end of the lake.',
            duration: '3h',
            rating: 4.6,
            order: 1,
          },
          {
            name: 'Malcesine',
            category: 'attraction',
            coordinates: { lat: 45.7644, lng: 10.8097 },
            description: 'Castle and cable car to Monte Baldo.',
            duration: '3h',
            rating: 4.7,
            order: 2,
          },
        ],
        [
          {
            name: 'Limone sul Garda',
            category: 'viewpoint',
            coordinates: { lat: 45.8172, lng: 10.7925 },
            description: 'Charming village, lemons and lake views.',
            duration: '2h',
            rating: 4.5,
            order: 1,
          },
          {
            name: 'Garda (town)',
            category: 'city',
            coordinates: { lat: 45.5784, lng: 10.7183 },
            description: 'Lakeside promenade and old town.',
            duration: '2h',
            rating: 4.5,
            order: 2,
          },
        ],
      ]
    )
  );

  // 6. Prague (3 days)
  const prahaStart = new Date(BASE_DATE.getTime() + 35 * 24 * 60 * 60 * 1000);
  ids.push(
    await createPlanWithDaysAndLocations(
      userId,
      'Prague',
      'Prague Castle, Charles Bridge, Old Town (sample data).',
      prahaStart,
      [
        [
          {
            name: 'Prague Castle (Hradčany)',
            category: 'attraction',
            coordinates: { lat: 50.0901, lng: 14.3996 },
            description: 'Castle, St. Vitus Cathedral, Golden Lane.',
            duration: '3h',
            openingHours: '6:00-22:00',
            rating: 4.8,
            order: 1,
          },
          {
            name: 'St. Vitus Cathedral',
            category: 'attraction',
            coordinates: { lat: 50.0909, lng: 14.3996 },
            description: 'Gothic cathedral within the castle.',
            duration: '1h',
            rating: 4.8,
            order: 2,
          },
        ],
        [
          {
            name: 'Charles Bridge',
            category: 'attraction',
            coordinates: { lat: 50.0865, lng: 14.4114 },
            description: 'Symbol of Prague, views over the Vltava.',
            duration: '1h',
            rating: 4.7,
            order: 1,
          },
          {
            name: 'Old Town Square',
            category: 'attraction',
            coordinates: { lat: 50.0877, lng: 14.4207 },
            description: 'Town hall with astronomical clock.',
            duration: '2h',
            rating: 4.7,
            order: 2,
          },
          {
            name: 'Jewish Quarter (Josefov)',
            category: 'attraction',
            coordinates: { lat: 50.0898, lng: 14.4176 },
            description: 'Synagogues and Jewish cemetery.',
            duration: '2h',
            rating: 4.6,
            order: 3,
          },
        ],
        [
          {
            name: 'Lennon Wall',
            category: 'attraction',
            coordinates: { lat: 50.086, lng: 14.4064 },
            description: 'Wall with graffiti and quotes.',
            duration: '30m',
            rating: 4.4,
            order: 1,
          },
          {
            name: 'Vyšehrad',
            category: 'attraction',
            coordinates: { lat: 50.0649, lng: 14.4172 },
            description: 'Fortress, cemetery, views over Prague.',
            duration: '2h',
            rating: 4.6,
            order: 2,
          },
        ],
      ]
    )
  );

  return ids;
}

/**
 * Delete all plans whose title contains the given pattern (e.g. "London").
 * Useful to remove old example/dummy plans before seeding new ones.
 */
export async function deletePlansByTitle(userId: string, titleContains: string): Promise<number> {
  const plans = await getTripPlans(userId);
  const toDelete = plans.filter((p) =>
    p.title.toLowerCase().includes(titleContains.toLowerCase())
  );
  for (const p of toDelete) {
    await deleteTripPlan(p.id);
  }
  return toDelete.length;
}

/** Map of old (Polish) example plan titles to [English title, English description]. */
const EXAMPLE_PLAN_TITLE_MIGRATION: Record<string, [string, string]> = {
  'Rzym szlakiem klasyków': ['Rome: classic highlights', 'Classic Rome landmarks (sample data).'],
  'Poznań zorientowane na restauracje': [
    'Poznań: food and sights',
    'Sights and recommended restaurants in Poznań (sample data).',
  ],
  'Berlin trip muzyczny': [
    'Berlin music trip',
    'Music and culture spots in Berlin (sample data).',
  ],
  'Tokyo trip fotograficzny': ['Tokyo photo trip', 'Best photo spots in Tokyo (sample data).'],
  'Jezioro Garda': [
    'Lake Garda',
    'Sirmione, Riva, Malcesine and surroundings (sample data).',
  ],
  Praga: ['Prague', 'Prague Castle, Charles Bridge, Old Town (sample data).'],
};

/**
 * Update existing example plans that still have Polish titles/descriptions to English.
 * Call once from the browser console after logging in: updateExamplePlanTitlesToEnglish(user.uid)
 * Then refresh the dashboard (e.g. reload or loadPlans()).
 */
export async function updateExamplePlanTitlesToEnglish(userId: string): Promise<number> {
  const plans = await getTripPlans(userId);
  let updated = 0;
  for (const plan of plans) {
    const mapping = EXAMPLE_PLAN_TITLE_MIGRATION[plan.title];
    if (mapping) {
      const [title, description] = mapping;
      await updateTripPlan(plan.id, { title, description });
      updated += 1;
    }
  }
  return updated;
}

/** English name + description for each location in each example plan (by plan title, then day index, then location order). */
const EXAMPLE_PLAN_LOCATIONS_EN: Record<string, { name: string; description?: string }[][]> = {
  'Rome: classic highlights': [
    [
      { name: 'Colosseum', description: 'Flavian Amphitheatre, symbol of Rome.' },
      { name: 'Forum Romanum', description: "Remains of ancient Rome's centre." },
      { name: 'Trevi Fountain', description: 'Baroque fountain, coin-throwing tradition.' },
    ],
    [
      { name: 'Pantheon', description: 'Temple of all gods, dome with oculus.' },
      { name: 'Spanish Steps', description: 'Famous steps and square by Barcaccia fountain.' },
    ],
    [
      { name: "St. Peter's Basilica", description: "Main Vatican church, Michelangelo's dome." },
      { name: 'Vatican Museums', description: 'Art collections, Sistine Chapel.' },
    ],
  ],
  'Poznań: food and sights': [
    [
      { name: 'Town Hall and Old Market Square', description: 'Renaissance town hall with billy goats.' },
      { name: 'Stary Browar', description: 'Shopping and culture centre in a brewery.' },
      { name: 'Pod Pretekstem', description: 'City centre restaurant, Polish cuisine with a twist.' },
    ],
    [
      { name: 'Poznań Cathedral', description: 'Cathedral Island, birthplace of the Polish state.' },
      { name: 'Croissant Museum', description: "St. Martin's croissant baking show." },
      { name: 'Weranda', description: 'Restaurant with a view of the market square.' },
    ],
  ],
  'Berlin music trip': [
    [
      { name: 'East Side Gallery', description: 'Section of the Berlin Wall with murals.' },
      { name: 'Holzmarkt', description: 'Culture and dining complex on the Spree.' },
      { name: 'Watergate', description: 'Music club on the banks of the Spree.' },
    ],
    [
      { name: 'Philharmonie', description: 'Home of the Berlin Philharmonic.' },
      { name: 'David Bowie Memorial', description: 'Mural and memorial to Bowie in Kreuzberg.' },
    ],
    [
      { name: 'Berghain / vicinity', description: "Icon of Berlin's club scene (exterior view)." },
      { name: 'RAW-Gelände', description: 'Culture area, street art, bars.' },
    ],
  ],
  'Tokyo photo trip': [
    [
      { name: 'Sensō-ji', description: "Tokyo's oldest temple, in Asakusa." },
      { name: 'Akihabara', description: 'Electronics, manga and gaming district.' },
    ],
    [
      { name: 'Shibuya Crossing', description: 'Famous crossing, best shots from above.' },
      { name: 'Meiji Jingu', description: 'Shinto shrine in the greenery of Yoyogi.' },
    ],
    [{ name: 'teamLab Borderless', description: 'Immersive digital art exhibition.' }],
    [
      { name: 'Shinjuku', description: 'Skyscrapers, neon streets, observatory views.' },
      { name: 'Yoyogi Park', description: 'Park next to Meiji, ideal for photos.' },
    ],
  ],
  'Lake Garda': [
    [
      { name: 'Sirmione – Scaliger Castle', description: 'Castle on the Sirmione peninsula.' },
      { name: 'Grotte di Catullo', description: 'Roman villa ruins with lake views.' },
    ],
    [
      { name: 'Riva del Garda', description: 'Picturesque town at the northern end of the lake.' },
      { name: 'Malcesine', description: 'Castle and cable car to Monte Baldo.' },
    ],
    [
      { name: 'Limone sul Garda', description: 'Charming village, lemons and lake views.' },
      { name: 'Garda (town)', description: 'Lakeside promenade and old town.' },
    ],
  ],
  Prague: [
    [
      { name: 'Prague Castle (Hradčany)', description: 'Castle, St. Vitus Cathedral, Golden Lane.' },
      { name: 'St. Vitus Cathedral', description: 'Gothic cathedral within the castle.' },
    ],
    [
      { name: 'Charles Bridge', description: 'Symbol of Prague, views over the Vltava.' },
      { name: 'Old Town Square', description: 'Town hall with astronomical clock.' },
      { name: 'Jewish Quarter (Josefov)', description: 'Synagogues and Jewish cemetery.' },
    ],
    [
      { name: 'Lennon Wall', description: 'Wall with graffiti and quotes.' },
      { name: 'Vyšehrad', description: 'Fortress, cemetery, views over Prague.' },
    ],
  ],
};

/** Set of the 6 example plan titles (English). Export for Dashboard migration. */
export const EXAMPLE_PLAN_TITLES_EN = new Set([
  'Rome: classic highlights',
  'Poznań: food and sights',
  'Berlin music trip',
  'Tokyo photo trip',
  'Lake Garda',
  'Prague',
]);

/**
 * Update location names and descriptions to English in existing example plans.
 * Run after updateExamplePlanTitlesToEnglish so plan titles are already English.
 */
export async function updateExamplePlanLocationsToEnglish(userId: string): Promise<number> {
  const plans = await getTripPlans(userId);
  let locationsUpdated = 0;
  for (const plan of plans) {
    if (!EXAMPLE_PLAN_TITLES_EN.has(plan.title as string)) continue;
    const dayLocations = EXAMPLE_PLAN_LOCATIONS_EN[plan.title];
    if (!dayLocations) continue;
    const fullPlan = await getTripPlan(plan.id);
    const daysSorted = [...fullPlan.days].sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));
    for (let d = 0; d < daysSorted.length && d < dayLocations.length; d++) {
      const day = daysSorted[d];
      const locsExpected = dayLocations[d];
      const locsSorted = [...day.locations].sort((a, b) => a.order - b.order);
      for (let i = 0; i < locsSorted.length && i < locsExpected.length; i++) {
        const loc = locsSorted[i];
        const { name, description } = locsExpected[i];
        await updateLocation(plan.id, day.id, loc.id, { name, description });
        locationsUpdated += 1;
      }
    }
  }
  return locationsUpdated;
}
