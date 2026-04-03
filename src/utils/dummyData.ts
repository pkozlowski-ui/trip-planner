import { createTripPlan, createDay, createLocation } from '../services/firebase/firestore';
import { LocationCategory } from '../types';

/**
 * Create a dummy trip plan with sample locations for testing
 * Optimized with parallel operations
 */
export async function createDummyTripPlan(userId: string): Promise<string> {
  const startTime = Date.now();
  console.log('[createDummyTripPlan] Starting...');
  
  // Create trip plan
  const planId = await createTripPlan(userId, {
    title: 'London Adventure',
    description: 'A sample trip plan with popular London attractions',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-03'),
    mapStyle: 'minimal',
    isPublic: false,
  });
  console.log(`[createDummyTripPlan] Plan created in ${Date.now() - startTime}ms`);

  // Create all days in parallel
  const [day1Id, day2Id, day3Id] = await Promise.all([
    createDay(planId, { dayNumber: 1, date: new Date('2024-06-01') }),
    createDay(planId, { dayNumber: 2, date: new Date('2024-06-02') }),
    createDay(planId, { dayNumber: 3, date: new Date('2024-06-03') }),
  ]);
  console.log(`[createDummyTripPlan] Days created in ${Date.now() - startTime}ms`);

  // Create all locations in parallel (grouped by day)
  await Promise.all([
    // Day 1 locations
    createLocation(planId, day1Id, {
      name: 'Tower Bridge',
      category: 'attraction' as LocationCategory,
      coordinates: { lat: 51.5055, lng: -0.0754 },
      description: 'Iconic Victorian bridge over the River Thames',
      duration: '1h',
      rating: 4.7,
      order: 1,
      media: [],
    }),
    createLocation(planId, day1Id, {
      name: 'Tower of London',
      category: 'museum' as LocationCategory,
      coordinates: { lat: 51.5081, lng: -0.0759 },
      description: 'Historic castle and royal palace',
      duration: '3h',
      openingHours: '9:00-17:30',
      rating: 4.6,
      order: 2,
      media: [],
    }),
    createLocation(planId, day1Id, {
      name: 'St. Paul\'s Cathedral',
      category: 'attraction' as LocationCategory,
      coordinates: { lat: 51.5138, lng: -0.0984 },
      description: 'Magnificent cathedral with stunning architecture',
      duration: '2h',
      openingHours: '8:30-16:30',
      rating: 4.8,
      order: 3,
      media: [],
    }),
    // Day 2 locations
    createLocation(planId, day2Id, {
      name: 'Big Ben',
      category: 'attraction' as LocationCategory,
      coordinates: { lat: 51.4994, lng: -0.1245 },
      description: 'Famous clock tower and symbol of London',
      duration: '30m',
      rating: 4.5,
      order: 1,
      media: [],
    }),
    createLocation(planId, day2Id, {
      name: 'London Eye',
      category: 'attraction' as LocationCategory,
      coordinates: { lat: 51.5033, lng: -0.1195 },
      description: 'Giant observation wheel on the South Bank',
      duration: '1h',
      openingHours: '10:00-20:30',
      rating: 4.4,
      order: 2,
      media: [],
    }),
    createLocation(planId, day2Id, {
      name: 'Westminster Abbey',
      category: 'museum' as LocationCategory,
      coordinates: { lat: 51.4994, lng: -0.1273 },
      description: 'Gothic abbey church and coronation site',
      duration: '2h',
      openingHours: '9:30-15:30',
      rating: 4.7,
      order: 3,
      media: [],
    }),
    createLocation(planId, day2Id, {
      name: 'Buckingham Palace',
      category: 'attraction' as LocationCategory,
      coordinates: { lat: 51.5014, lng: -0.1419 },
      description: 'Official residence of the British monarch',
      duration: '1h 30m',
      openingHours: '9:30-19:30',
      rating: 4.3,
      order: 4,
      media: [],
    }),
    // Day 3 locations
    createLocation(planId, day3Id, {
      name: 'British Museum',
      category: 'museum' as LocationCategory,
      coordinates: { lat: 51.5194, lng: -0.1270 },
      description: 'World-famous museum of human history and culture',
      duration: '4h',
      openingHours: '10:00-17:00',
      rating: 4.8,
      order: 1,
      media: [],
    }),
    createLocation(planId, day3Id, {
      name: 'Hyde Park',
      category: 'park' as LocationCategory,
      coordinates: { lat: 51.5073, lng: -0.1657 },
      description: 'Large royal park in central London',
      duration: '2h',
      rating: 4.6,
      order: 2,
      media: [],
    }),
    createLocation(planId, day3Id, {
      name: 'Natural History Museum',
      category: 'museum' as LocationCategory,
      coordinates: { lat: 51.4967, lng: -0.1764 },
      description: 'Museum showcasing natural history specimens',
      duration: '3h',
      openingHours: '10:00-17:50',
      rating: 4.7,
      order: 3,
      media: [],
    }),
  ]);
  
  console.log(`[createDummyTripPlan] Finished in ${Date.now() - startTime}ms`);
  return planId;
}

