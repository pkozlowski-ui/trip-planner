import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  DocumentData,
  getDocsFromCache,
  getDocsFromServer,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import {
  TripPlan,
  TripPlanDocument,
  Day,
  DayDocument,
  Location,
  LocationDocument,
  Transport,
  MediaItem,
} from '../../types';
import { pickCoverImageFromPlan, type PlanCoverResult } from '../../utils/planCover';

/**
 * Helper function to convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: Timestamp | Date | undefined | null): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return undefined;
}

/**
 * Convert TripPlanDocument from Firestore to TripPlan
 */
function tripPlanDocToTripPlan(docSnap: DocumentSnapshot<DocumentData>): TripPlanDocument {
  const data = docSnap.data() as TripPlanDocument;
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    startDate: timestampToDate(data.startDate),
    endDate: timestampToDate(data.endDate),
    totalDays: data.totalDays || 0,
    totalPoints: data.totalPoints || 0,
    totalDistance: data.totalDistance || 0,
    mapStyle: data.mapStyle,
    isPublic: data.isPublic || false,
    shareToken: data.shareToken,
    coverImage: data.coverImage ?? undefined,
    coverImageAttribution: data.coverImageAttribution ?? undefined,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
}

/**
 * Convert DayDocument from Firestore to Day
 */
function dayDocToDay(docSnap: DocumentSnapshot<DocumentData>, locations: Location[] = [], transports: Transport[] = []): Day {
  const data = docSnap.data() as DayDocument;
  return {
    id: docSnap.id,
    dayNumber: data.dayNumber,
    date: timestampToDate(data.date),
    locations,
    transports,
    notes: data.notes,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
}

/**
 * Convert LocationDocument from Firestore to Location
 */
function locationDocToLocation(docSnap: DocumentSnapshot<DocumentData>): Location {
  const data = docSnap.data() as LocationDocument;
  return {
    id: docSnap.id,
    name: data.name,
    category: data.category,
    coordinates: data.coordinates,
    description: data.description,
    image: data.image,
    imageAttribution: data.imageAttribution,
    website: data.website,
    wikipediaUrl: data.wikipediaUrl,
    wikidataId: data.wikidataId,
    duration: data.duration,
    openingHours: data.openingHours,
    rating: data.rating,
    order: data.order,
    media: data.media || [],
    notes: data.notes,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
}

/**
 * Convert TransportDocument from Firestore to Transport
 */
function transportDocToTransport(docSnap: DocumentSnapshot<DocumentData>): Transport {
  const data = docSnap.data();
  if (!data) {
    throw new Error('Transport document data is missing');
  }
  return {
    id: docSnap.id,
    fromLocationId: data.fromLocationId,
    toLocationId: data.toLocationId,
    type: data.type,
    distance: data.distance,
    time: data.time,
    route: data.route,
    notes: data.notes,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
}

/**
 * Get all trip plans for a user (summary only, no days/locations).
 * Always fetches from server so coverImage and other fields are up to date (e.g. after refreshPlanCover).
 */
export async function getTripPlans(userId: string): Promise<TripPlan[]> {
  const startTime = Date.now();
  try {
    const plansRef = collection(db, 'tripPlans');
    const q = query(plansRef, where('userId', '==', userId));
    const plansSnapshot = await getDocs(q);

    const plans: TripPlan[] = plansSnapshot.docs.map((docSnap) => {
      const planDoc = tripPlanDocToTripPlan(docSnap);
      return {
        ...planDoc,
        days: [], // Summary only - no days loaded
      };
    });

    // Sort by updatedAt descending
    plans.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    console.log(`[getTripPlans] Loaded ${plans.length} plans in ${Date.now() - startTime}ms`);
    return plans;
  } catch (error: any) {
    console.error('Error getting trip plans:', error);
    
    // Check for missing index error
    if (error.code === 'failed-precondition' && error.message?.includes('index')) {
      const indexLink = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0];
      if (indexLink) {
        console.error('⚠️ MISSING INDEX: Query requires an index.');
        console.error(`🔗 CLICK THIS LINK TO CREATE THE INDEX AUTOMATICALLY:`);
        console.error(indexLink);
        throw new Error(`Missing Firestore index. Click the link in console to create it: ${indexLink}`);
      }
    }
    
    throw error;
  }
}

/**
 * Get a single trip plan with all days and locations
 */
export async function getTripPlan(planId: string, fromServer = false): Promise<TripPlan> {
  const startTime = Date.now();
  
  try {
    // Get plan document
    const planRef = doc(db, 'tripPlans', planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      throw new Error('Trip plan not found');
    }

    const planData = tripPlanDocToTripPlan(planDoc);

    // Get days with locations and transports in parallel
    const days = await getDays(planId, fromServer);

    // Calculate computed properties
    const totalDays = days.length;
    const totalPoints = days.reduce((sum, day) => sum + day.locations.length, 0);
    const totalDistance = days.reduce((sum, day) => {
      const dayDistance = day.transports.reduce((transportSum, transport) => 
        transportSum + (transport.distance || 0), 0
      );
      return sum + dayDistance;
    }, 0);

    const tripPlan: TripPlan = {
      ...planData,
      days,
      totalDays,
      totalPoints,
      totalDistance,
    };

    console.log(`[getTripPlan] Loaded plan ${planId} with ${totalDays} days, ${totalPoints} locations in ${Date.now() - startTime}ms`);
    return tripPlan;
  } catch (error) {
    console.error('Error getting trip plan:', error);
    throw error;
  }
}

/**
 * Get all days for a trip plan with locations and transports
 */
export async function getDays(planId: string, fromServer = false): Promise<Day[]> {
  const startTime = Date.now();
  try {
    const daysRef = collection(db, 'tripPlans', planId, 'days');
    const q = query(daysRef, orderBy('dayNumber', 'asc'));
    
    let daysSnapshot;
    if (fromServer) {
      daysSnapshot = await getDocsFromServer(q);
    } else {
      try {
        daysSnapshot = await getDocsFromCache(q);
        if (daysSnapshot.docs.length > 0) {
          console.log(`[getDays] Using cache (${daysSnapshot.docs.length} docs)`);
        }
      } catch (cacheError) {
        daysSnapshot = await getDocs(q);
      }
    }

    const dayDocs = daysSnapshot.docs;

    // Fetch locations and transports for all days in parallel
    const daysWithData = await Promise.all(
      dayDocs.map(async (dayDoc) => {
        const dayId = dayDoc.id;
        const [locations, transports] = await Promise.all([
          getLocations(planId, dayId, fromServer),
          getTransports(planId, dayId),
        ]);
        return dayDocToDay(dayDoc, locations, transports);
      })
    );

    console.log(`[getDays] Total time: ${Date.now() - startTime}ms`);
    return daysWithData;
  } catch (error: any) {
    console.error('Error getting days:', error);
    
    // Check for missing index error
    if (error.code === 'failed-precondition' && error.message?.includes('index')) {
      const indexLink = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0];
      if (indexLink) {
        console.error('⚠️ MISSING INDEX: Query requires an index.');
        console.error(`🔗 CLICK THIS LINK TO CREATE THE INDEX AUTOMATICALLY:`);
        console.error(indexLink);
        throw new Error(`Missing Firestore index. Click the link in console to create it: ${indexLink}`);
      }
    }
    
    throw error;
  }
}

/**
 * Get all locations for a day
 */
export async function getLocations(planId: string, dayId: string, fromServer = false): Promise<Location[]> {
  try {
    const locationsRef = collection(db, 'tripPlans', planId, 'days', dayId, 'locations');
    const q = query(locationsRef, orderBy('order', 'asc'));
    
    let locationsSnapshot;
    if (fromServer) {
      locationsSnapshot = await getDocsFromServer(q);
    } else {
      try {
        locationsSnapshot = await getDocsFromCache(q);
        if (locationsSnapshot.docs.length > 0) {
          console.log(`[getLocations] Using cache (${locationsSnapshot.docs.length} docs)`);
        }
      } catch (cacheError) {
        locationsSnapshot = await getDocs(q);
      }
    }

    const locations: Location[] = [];
    locationsSnapshot.forEach((docSnap) => {
      locations.push(locationDocToLocation(docSnap));
    });

    return locations;
  } catch (error: any) {
    console.error('Error getting locations:', error);
    
    // Check for missing index error
    if (error.code === 'failed-precondition' && error.message?.includes('index')) {
      const indexLink = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0];
      if (indexLink) {
        console.error('⚠️ MISSING INDEX: Query requires an index.');
        console.error(`🔗 CLICK THIS LINK TO CREATE THE INDEX AUTOMATICALLY:`);
        console.error(indexLink);
        throw new Error(`Missing Firestore index. Click the link in console to create it: ${indexLink}`);
      }
    }
    
    throw error;
  }
}

/**
 * Get all transports for a day
 */
export async function getTransports(planId: string, dayId: string): Promise<Transport[]> {
  try {
    const transportsRef = collection(db, 'tripPlans', planId, 'days', dayId, 'transports');
    const q = query(transportsRef, orderBy('createdAt', 'asc'));
    
    // Try cache first
    let transportsSnapshot;
    try {
      transportsSnapshot = await getDocsFromCache(q);
      if (transportsSnapshot.docs.length > 0) {
        console.log(`[getTransports] Using cache (${transportsSnapshot.docs.length} docs)`);
      }
    } catch (cacheError) {
      // Cache miss, fetch from server
      transportsSnapshot = await getDocs(q);
    }

    const transports: Transport[] = [];
    transportsSnapshot.forEach((docSnap) => {
      transports.push(transportDocToTransport(docSnap));
    });

    return transports;
  } catch (error: any) {
    console.error('Error getting transports:', error);
    
    // Check for missing index error
    if (error.code === 'failed-precondition' && error.message?.includes('index')) {
      const indexLink = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0];
      if (indexLink) {
        console.error('⚠️ MISSING INDEX: Query requires an index.');
        console.error(`🔗 CLICK THIS LINK TO CREATE THE INDEX AUTOMATICALLY:`);
        console.error(indexLink);
        throw new Error(`Missing Firestore index. Click the link in console to create it: ${indexLink}`);
      }
    }
    
    throw error;
  }
}

/**
 * Create a new trip plan
 */
export async function createTripPlan(
  userId: string,
  planData: Omit<TripPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'days' | 'totalDays' | 'totalPoints' | 'totalDistance'>
): Promise<string> {
  try {
    const plansRef = collection(db, 'tripPlans');
    const newPlan: Record<string, any> = {
      userId,
      title: planData.title,
      isPublic: planData.isPublic || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add optional fields only if they are defined
    if (planData.description !== undefined && planData.description !== null) {
      newPlan.description = planData.description;
    }
    if (planData.startDate !== undefined && planData.startDate !== null) {
      newPlan.startDate = Timestamp.fromDate(planData.startDate);
    }
    if (planData.endDate !== undefined && planData.endDate !== null) {
      newPlan.endDate = Timestamp.fromDate(planData.endDate);
    }
    if (planData.mapStyle !== undefined && planData.mapStyle !== null) {
      newPlan.mapStyle = planData.mapStyle;
    }
    if (planData.shareToken !== undefined && planData.shareToken !== null) {
      newPlan.shareToken = planData.shareToken;
    }

    // Remove any undefined values
    Object.keys(newPlan).forEach((key) => {
      if (newPlan[key] === undefined) {
        delete newPlan[key];
      }
    });

    const docRef = await addDoc(plansRef, newPlan);
    return docRef.id;
  } catch (error) {
    console.error('Error creating trip plan:', error);
    throw error;
  }
}

/**
 * Update a trip plan
 */
export async function updateTripPlan(
  planId: string,
  updates: Partial<Omit<TripPlan, 'id' | 'userId' | 'createdAt' | 'days' | 'totalDays' | 'totalPoints' | 'totalDistance'>>
): Promise<void> {
  try {
    const planRef = doc(db, 'tripPlans', planId);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert Date objects to Timestamps
    if (updateData.startDate instanceof Date) {
      updateData.startDate = Timestamp.fromDate(updateData.startDate);
    }
    if (updateData.endDate instanceof Date) {
      updateData.endDate = Timestamp.fromDate(updateData.endDate);
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.days;
    delete updateData.totalDays;
    delete updateData.totalPoints;
    delete updateData.totalDistance;

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(planRef, updateData);
  } catch (error) {
    console.error('Error updating trip plan:', error);
    throw error;
  }
}

/**
 * Recompute and persist plan cover image from best location image.
 * Call after location add/update/delete/reorder.
 * Returns the picked cover so callers can update local state without refetching.
 *
 * Pass `existingPlan` when the caller already has the full plan in memory to avoid
 * an extra Firestore read.
 */
export async function refreshPlanCover(planId: string, existingPlan?: TripPlan): Promise<PlanCoverResult | null> {
  const plan = existingPlan ?? await getTripPlan(planId);
  const result = pickCoverImageFromPlan(plan);
  const planRef = doc(db, 'tripPlans', planId);
  await updateDoc(planRef, {
    coverImage: result?.url ?? null,
    coverImageAttribution: result?.attribution ?? null,
    updatedAt: serverTimestamp(),
  });
  return result;
}

/**
 * Delete a trip plan and all its days/locations
 */
export async function deleteTripPlan(planId: string): Promise<void> {
  try {
    // Get all days first
    const days = await getDays(planId);
    
    // Delete all locations and transports for each day
    for (const day of days) {
      for (const location of day.locations) {
        await deleteLocation(planId, day.id, location.id);
      }
      for (const transport of day.transports) {
        await deleteTransport(planId, day.id, transport.id);
      }
      await deleteDay(planId, day.id);
    }

    // Delete the plan
    const planRef = doc(db, 'tripPlans', planId);
    await deleteDoc(planRef);
  } catch (error) {
    console.error('Error deleting trip plan:', error);
    throw error;
  }
}

/**
 * Remove duplicate plans: for each plan title, keep one (oldest by createdAt) and delete the rest.
 * Returns the number of plans deleted.
 */
export async function deleteDuplicatePlans(userId: string): Promise<number> {
  const plans = await getTripPlans(userId);
  const byTitle = new Map<string, TripPlan[]>();
  for (const p of plans) {
    const key = (p.title || '').trim() || '(no title)';
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(p);
  }
  let deleted = 0;
  for (const [, group] of byTitle) {
    if (group.length <= 1) continue;
    group.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
    for (let i = 1; i < group.length; i++) {
      await deleteTripPlan(group[i].id);
      deleted++;
    }
  }
  return deleted;
}

/**
 * Create a new day
 */
export async function createDay(
  planId: string,
  dayData: Omit<Day, 'id' | 'createdAt' | 'updatedAt' | 'locations' | 'transports'>
): Promise<string> {
  try {
    const daysRef = collection(db, 'tripPlans', planId, 'days');
    const newDay: Record<string, any> = {
      planId,
      dayNumber: dayData.dayNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add optional fields only if they are defined
    if (dayData.date !== undefined && dayData.date !== null) {
      newDay.date = Timestamp.fromDate(dayData.date);
    }
    if (dayData.notes !== undefined && dayData.notes !== null) {
      newDay.notes = dayData.notes;
    }

    // Remove any undefined values
    Object.keys(newDay).forEach((key) => {
      if (newDay[key] === undefined) {
        delete newDay[key];
      }
    });

    const docRef = await addDoc(daysRef, newDay);
    return docRef.id;
  } catch (error) {
    console.error('Error creating day:', error);
    throw error;
  }
}

/**
 * Update a day
 */
export async function updateDay(
  planId: string,
  dayId: string,
  updates: Partial<Omit<Day, 'id' | 'createdAt' | 'locations' | 'transports'>>
): Promise<void> {
  try {
    const dayRef = doc(db, 'tripPlans', planId, 'days', dayId);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert Date objects to Timestamps
    if (updateData.date instanceof Date) {
      updateData.date = Timestamp.fromDate(updateData.date);
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.locations;
    delete updateData.transports;

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(dayRef, updateData);
  } catch (error) {
    console.error('Error updating day:', error);
    throw error;
  }
}

/**
 * Delete a day and all its locations and transports
 */
export async function deleteDay(planId: string, dayId: string): Promise<void> {
  try {
    // Delete all locations first
    const locations = await getLocations(planId, dayId);
    for (const location of locations) {
      await deleteLocation(planId, dayId, location.id);
    }

    // Delete all transports
    const transports = await getTransports(planId, dayId);
    for (const transport of transports) {
      await deleteTransport(planId, dayId, transport.id);
    }

    // Delete the day
    const dayRef = doc(db, 'tripPlans', planId, 'days', dayId);
    await deleteDoc(dayRef);
  } catch (error) {
    console.error('Error deleting day:', error);
    throw error;
  }
}

/**
 * Create a new location
 */
export async function createLocation(
  planId: string,
  dayId: string,
  locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const locationsRef = collection(db, 'tripPlans', planId, 'days', dayId, 'locations');
    
    // Clean media items - remove undefined values
    const cleanedMedia = (locationData.media || []).map((mediaItem) => {
      const cleanedItem: Record<string, any> = {
        id: mediaItem.id,
        type: mediaItem.type,
        url: mediaItem.url,
        createdAt: mediaItem.createdAt,
      };
      
      // Only add optional fields if they have values
      if (mediaItem.thumbnail) {
        cleanedItem.thumbnail = mediaItem.thumbnail;
      }
      if (mediaItem.title) {
        cleanedItem.title = mediaItem.title;
      }
      if (mediaItem.description) {
        cleanedItem.description = mediaItem.description;
      }
      
      return cleanedItem;
    });
    
    const newLocation: Record<string, any> = {
      planId,
      dayId,
      name: locationData.name,
      category: locationData.category,
      coordinates: locationData.coordinates,
      order: locationData.order,
      media: cleanedMedia,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add optional fields only if they are defined
    if (locationData.description !== undefined && locationData.description !== null) {
      newLocation.description = locationData.description;
    }
    if (locationData.image !== undefined && locationData.image !== null) {
      newLocation.image = locationData.image;
    }
    if (locationData.duration !== undefined && locationData.duration !== null) {
      newLocation.duration = locationData.duration;
    }
    if (locationData.openingHours !== undefined && locationData.openingHours !== null) {
      newLocation.openingHours = locationData.openingHours;
    }
    if (locationData.rating !== undefined && locationData.rating !== null) {
      newLocation.rating = locationData.rating;
    }
    if (locationData.notes !== undefined && locationData.notes !== null) {
      newLocation.notes = locationData.notes;
    }
    if (locationData.website !== undefined && locationData.website !== null) {
      newLocation.website = locationData.website;
    }
    if (locationData.wikipediaUrl !== undefined && locationData.wikipediaUrl !== null) {
      newLocation.wikipediaUrl = locationData.wikipediaUrl;
    }
    if (locationData.wikidataId !== undefined && locationData.wikidataId !== null) {
      newLocation.wikidataId = locationData.wikidataId;
    }
    if (locationData.imageAttribution !== undefined && locationData.imageAttribution !== null) {
      newLocation.imageAttribution = locationData.imageAttribution;
    }

    // Remove any undefined values
    Object.keys(newLocation).forEach((key) => {
      if (newLocation[key] === undefined) {
        delete newLocation[key];
      }
    });

    const docRef = await addDoc(locationsRef, newLocation);
    return docRef.id;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
}

/**
 * Update a location
 */
export async function updateLocation(
  planId: string,
  dayId: string,
  locationId: string,
  updates: Partial<Omit<Location, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const locationRef = doc(db, 'tripPlans', planId, 'days', dayId, 'locations', locationId);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    // Clean media items - remove undefined values
    if (updateData.media && Array.isArray(updateData.media)) {
      updateData.media = updateData.media.map((mediaItem: any) => {
        const cleanedMedia: Record<string, any> = {
          id: mediaItem.id,
          type: mediaItem.type,
          url: mediaItem.url,
          createdAt: mediaItem.createdAt,
        };
        
        // Only add optional fields if they have values
        if (mediaItem.thumbnail) {
          cleanedMedia.thumbnail = mediaItem.thumbnail;
        }
        if (mediaItem.title) {
          cleanedMedia.title = mediaItem.title;
        }
        if (mediaItem.description) {
          cleanedMedia.description = mediaItem.description;
        }
        
        return cleanedMedia;
      });
    }

    // Remove undefined values from top level
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(locationRef, updateData);
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

/**
 * Delete a location
 */
export async function deleteLocation(
  planId: string,
  dayId: string,
  locationId: string
): Promise<void> {
  try {
    const locationRef = doc(db, 'tripPlans', planId, 'days', dayId, 'locations', locationId);
    await deleteDoc(locationRef);
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

/**
 * Move a location to a new position or different day
 * This function handles reordering within the same day or moving between days
 */
export async function moveLocation(
  planId: string,
  sourceDayId: string,
  locationId: string,
  targetDayId: string,
  newOrder: number
): Promise<void> {
  try {
    const locationRef = doc(db, 'tripPlans', planId, 'days', sourceDayId, 'locations', locationId);
    const locationSnap = await getDoc(locationRef);
    
    if (!locationSnap.exists()) {
      throw new Error('Location not found');
    }

    const locationData = locationSnap.data();

    if (sourceDayId === targetDayId) {
      // Same day - just update order
      await updateDoc(locationRef, {
        order: newOrder,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Different day - need to move the location
      // First, get all locations in target day to recalculate orders
      const targetLocationsRef = collection(db, 'tripPlans', planId, 'days', targetDayId, 'locations');
      const targetLocationsSnapshot = await getDocs(query(targetLocationsRef, orderBy('order', 'asc')));
      
      // Update orders of existing locations in target day if needed
      const batch = writeBatch(db);
      let currentOrder = 0;
      
      targetLocationsSnapshot.forEach((docSnap) => {
        const existingOrder = docSnap.data().order;
        if (currentOrder >= newOrder) {
          // Shift existing locations down
          batch.update(docSnap.ref, {
            order: existingOrder + 1,
            updatedAt: serverTimestamp(),
          });
        }
        currentOrder = existingOrder + 1;
      });

      // Create location in new day with new order
      const newLocationRef = doc(targetLocationsRef);
      const newLocationData: Record<string, any> = {
        ...locationData,
        dayId: targetDayId,
        order: newOrder,
        updatedAt: serverTimestamp(),
      };
      delete newLocationData.id;
      delete newLocationData.createdAt;
      
      batch.set(newLocationRef, {
        ...newLocationData,
        createdAt: locationData.createdAt || serverTimestamp(),
      });

      // Update orders in source day
      const sourceLocationsRef = collection(db, 'tripPlans', planId, 'days', sourceDayId, 'locations');
      const sourceLocationsSnapshot = await getDocs(query(sourceLocationsRef, orderBy('order', 'asc')));
      
      sourceLocationsSnapshot.forEach((docSnap) => {
        const existingOrder = docSnap.data().order;
        if (existingOrder > locationData.order) {
          // Shift remaining locations up
          batch.update(docSnap.ref, {
            order: existingOrder - 1,
            updatedAt: serverTimestamp(),
          });
        }
      });

      // Delete original location
      batch.delete(locationRef);

      await batch.commit();
    }

    // Recalculate orders in both days to ensure consistency
    await recalculateLocationOrders(planId, sourceDayId);
    if (sourceDayId !== targetDayId) {
      await recalculateLocationOrders(planId, targetDayId);
    }
  } catch (error) {
    console.error('Error moving location:', error);
    throw error;
  }
}

/**
 * Recalculate and update location orders to be sequential (0, 1, 2, ...)
 */
async function recalculateLocationOrders(planId: string, dayId: string): Promise<void> {
  try {
    const locationsRef = collection(db, 'tripPlans', planId, 'days', dayId, 'locations');
    const locationsSnapshot = await getDocs(query(locationsRef, orderBy('order', 'asc')));
    
    const batch = writeBatch(db);
    let newOrder = 0;
    
    locationsSnapshot.forEach((docSnap) => {
      if (docSnap.data().order !== newOrder) {
        batch.update(docSnap.ref, {
          order: newOrder,
          updatedAt: serverTimestamp(),
        });
      }
      newOrder++;
    });

    if (newOrder > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Error recalculating location orders:', error);
    throw error;
  }
}

/**
 * Create a new transport
 */
export async function createTransport(
  planId: string,
  dayId: string,
  transportData: Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const transportsRef = collection(db, 'tripPlans', planId, 'days', dayId, 'transports');
    const newTransport: Record<string, any> = {
      planId,
      dayId,
      fromLocationId: transportData.fromLocationId,
      toLocationId: transportData.toLocationId,
      type: transportData.type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add optional fields only if they are defined
    if (transportData.distance !== undefined && transportData.distance !== null) {
      newTransport.distance = transportData.distance;
    }
    if (transportData.time !== undefined && transportData.time !== null) {
      newTransport.time = transportData.time;
    }
    if (transportData.route !== undefined && transportData.route !== null) {
      newTransport.route = transportData.route;
    }
    if (transportData.notes !== undefined && transportData.notes !== null) {
      newTransport.notes = transportData.notes;
    }

    // Remove any undefined values
    Object.keys(newTransport).forEach((key) => {
      if (newTransport[key] === undefined) {
        delete newTransport[key];
      }
    });

    const docRef = await addDoc(transportsRef, newTransport);
    return docRef.id;
  } catch (error) {
    console.error('Error creating transport:', error);
    throw error;
  }
}

/**
 * Update a transport
 */
export async function updateTransport(
  planId: string,
  dayId: string,
  transportId: string,
  updates: Partial<Omit<Transport, 'id' | 'createdAt' | 'fromLocationId' | 'toLocationId'>>
): Promise<void> {
  try {
    const transportRef = doc(db, 'tripPlans', planId, 'days', dayId, 'transports', transportId);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.fromLocationId;
    delete updateData.toLocationId;

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(transportRef, updateData);
  } catch (error) {
    console.error('Error updating transport:', error);
    throw error;
  }
}

/**
 * Delete a transport
 */
export async function deleteTransport(
  planId: string,
  dayId: string,
  transportId: string
): Promise<void> {
  try {
    const transportRef = doc(db, 'tripPlans', planId, 'days', dayId, 'transports', transportId);
    await deleteDoc(transportRef);
  } catch (error) {
    console.error('Error deleting transport:', error);
    throw error;
  }
}

/**
 * Add media to a location
 */
export async function addMediaToLocation(
  planId: string,
  dayId: string,
  locationId: string,
  media: Omit<MediaItem, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const locationRef = doc(db, 'tripPlans', planId, 'days', dayId, 'locations', locationId);
    const locationDoc = await getDoc(locationRef);
    
    if (!locationDoc.exists()) {
      throw new Error('Location not found');
    }

    const locationData = locationDocToLocation(locationDoc);
    const updatedMedia = [
      ...locationData.media,
      {
        ...media,
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      },
    ];

    await updateDoc(locationRef, {
      media: updatedMedia,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding media to location:', error);
    throw error;
  }
}

/**
 * Remove media from a location
 */
export async function removeMediaFromLocation(
  planId: string,
  dayId: string,
  locationId: string,
  mediaId: string
): Promise<void> {
  try {
    const locationRef = doc(db, 'tripPlans', planId, 'days', dayId, 'locations', locationId);
    const locationDoc = await getDoc(locationRef);
    
    if (!locationDoc.exists()) {
      throw new Error('Location not found');
    }

    const locationData = locationDocToLocation(locationDoc);
    const updatedMedia = locationData.media.filter((m) => m.id !== mediaId);

    await updateDoc(locationRef, {
      media: updatedMedia,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing media from location:', error);
    throw error;
  }
}
