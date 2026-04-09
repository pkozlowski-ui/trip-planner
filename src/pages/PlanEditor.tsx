import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useTripPlans } from '../contexts/TripPlansContext';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import MapView, { MapBounds } from '../components/map/MapView';
import ContextMenu from '../components/map/ContextMenu';
import LocationFormModal, { LocationFormData } from '../components/map/LocationFormModal';
import TripPlanFormModal, { TripPlanFormData } from '../components/plan/TripPlanFormModal';
import TransportFormModal, { TransportFormData } from '../components/transport/TransportFormModal';
import { Location, Transport, LocationCategory } from '../types';
import { GeocodingResult } from '../services/geocoding';
import { reverseGeocode } from '../services/geocoding';
import { enrichLocationFromWikidata, parseWikidataId, searchWikidataByQuery, type EnrichedLocationData } from '../services/wikimedia';
import { createLocation, updateLocation, deleteLocation, createDay, getTripPlan, updateTripPlan, createTransport, updateTransport, deleteTransport, moveLocation, refreshPlanCover } from '../services/firebase/firestore';
import { calculateRoute, formatDuration } from '../services/routing';
import { InlineNotification, Loading } from '@carbon/react';
import { TamboProvider } from '@tambo-ai/react';
import { ChatMapProvider } from '../contexts/ChatMapContext';
import { buildTamboTools, buildPlanSummaryContextHelper, type TamboAgentDeps } from '../agent/tamboTools';
import { tamboChatComponents } from '../agent/tamboComponents';

function geocodingResultToCategory(result: GeocodingResult): LocationCategory {
  const type = (result.type || '').toLowerCase();
  const category = (result.category || '').toLowerCase();
  if (type === 'museum' || category === 'museum') return 'museum';
  if (type === 'restaurant' || category === 'restaurant') return 'restaurant';
  if (type === 'cafe' || category === 'cafe') return 'restaurant';
  if (type === 'hotel' || category === 'hotel' || type === 'hostel') return 'hotel';
  if (type === 'attraction' || category === 'attraction' || type === 'monument' || type === 'artwork') return 'attraction';
  if (type === 'viewpoint') return 'viewpoint';
  if (type === 'park' || category === 'park') return 'park';
  if (type === 'beach') return 'beach';
  if (type === 'mountain' || category === 'natural') return 'mountain';
  if (category === 'historic' || result.extratags?.historic) return 'attraction';
  if (category === 'tourism') return 'attraction';
  if (type === 'city' || type === 'town' || type === 'village') return 'city';
  return 'other';
}

function PlanEditor() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadPlan, currentPlan, loading, deletePlan } = useTripPlans();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [mapZoom, setMapZoom] = useState(13);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [searchMarker, setSearchMarker] = useState<{
    lat: number;
    lng: number;
    name: string;
    description?: string;
    wikipediaUrl?: string;
    image?: string;
    imageAttribution?: import('../types').ImageAttribution;
    openingHours?: string;
    website?: string;
  } | null>(null);
  const [contextMenuLocationInfo, setContextMenuLocationInfo] = useState<GeocodingResult | null>(null);
  const [contextMenuEnriched, setContextMenuEnriched] = useState<EnrichedLocationData | null>(null);
  const [isLoadingLocationInfo, setIsLoadingLocationInfo] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [pendingTransportFrom, setPendingTransportFrom] = useState<string | null>(null);
  const [pendingTransportTo, setPendingTransportTo] = useState<string | null>(null);
  const [isAddingTransport, setIsAddingTransport] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [pendingLocationCoords, setPendingLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingLocationName, setPendingLocationName] = useState<string>('');
  const [pendingLocationGeocodingResult, setPendingLocationGeocodingResult] = useState<GeocodingResult | null>(null);
  const [pendingLocationEnriched, setPendingLocationEnriched] = useState<EnrichedLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [showWizardToast, setShowWizardToast] = useState(false);
  const routerLocation = useLocation();
  const locationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const enrichedLocationIdsRef = useRef<Set<string>>(new Set());

  // Memoized callback for bounds changes to prevent unnecessary re-renders
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const onSearchMarkerClear = useCallback(() => setSearchMarker(null), []);

  // Show personalized toast and auto-open chat when entering from the Dashboard Wizard
  useEffect(() => {
    if (routerLocation.state?.fromWizard) {
      setShowWizardToast(true);
      // Auto-open the AI co-pilot panel so the user can immediately ask questions
      if ((import.meta.env.VITE_TAMBO_API_KEY ?? '').trim()) {
        setIsChatOpen(true);
      }
      const t = setTimeout(() => setShowWizardToast(false), 7000);
      return () => clearTimeout(t);
    }
  }, [routerLocation.state]);

  useEffect(() => {
    if (planId && planId !== 'new') {
      console.log('[PlanEditor] Loading plan:', planId);
      loadPlan(planId).catch((err) => {
        console.error('[PlanEditor] Error loading plan:', err);
        setError(err.message || 'Failed to load trip plan');
      });
    }
  }, [planId, loadPlan]);

  // Pull Wikipedia/Commons images for existing locations that have no image (by wikidataId or by name search).
  // Runs all locations in parallel (capped at 4 concurrent), then a single loadPlan + refreshPlanCover at the end.
  useEffect(() => {
    if (!planId || planId === 'new' || !currentPlan?.days) return;

    const toEnrich: { location: Location; dayId: string }[] = [];
    currentPlan.days.forEach((day) => {
      if (!day?.locations) return;
      day.locations.forEach((loc) => {
        if (loc.image || enrichedLocationIdsRef.current.has(loc.id)) return;
        if (loc.wikidataId || (loc.name && loc.name.trim().length >= 2)) {
          toEnrich.push({ location: loc, dayId: day.id });
        }
      });
    });

    if (toEnrich.length === 0) return;

    const CONCURRENCY = 4;
    let cancelled = false;

    const enrichOne = async ({ location, dayId }: { location: Location; dayId: string }): Promise<boolean> => {
      if (cancelled) return false;
      let qId: string | null = location.wikidataId ? parseWikidataId(location.wikidataId) : null;
      if (!qId && location.name?.trim()) {
        qId = await searchWikidataByQuery(location.name.trim());
      }
      if (!qId || cancelled) return false;
      const enriched = await enrichLocationFromWikidata(qId);
      if (cancelled || !enriched.image) return false;
      await updateLocation(planId, dayId, location.id, {
        image: enriched.image,
        imageAttribution: enriched.imageAttribution,
        wikidataId: qId,
      });
      enrichedLocationIdsRef.current.add(location.id);
      return true;
    };

    const runBatch = async () => {
      let anyUpdated = false;
      // Process in batches of CONCURRENCY
      for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
        if (cancelled) break;
        const batch = toEnrich.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(batch.map(enrichOne));
        if (results.some((r) => r.status === 'fulfilled' && r.value === true)) {
          anyUpdated = true;
        }
      }
      // Single reload and cover refresh after all enrichments complete
      if (!cancelled && anyUpdated) {
        await loadPlan(planId, true);
        await refreshPlanCover(planId);
      }
    };

    runBatch().catch(() => {});
    return () => { cancelled = true; };
  }, [planId, currentPlan?.id, loadPlan]);

  // Enable auto-save for existing plans
  useAutoSave(planId, planId !== undefined && planId !== 'new');

  // Collect all locations from all days with their day numbers
  const locationsWithDayInfo = useMemo(() => {
    if (!currentPlan) {
      console.log('[PlanEditor] No currentPlan, returning empty locations');
      return [];
    }
    
    if (!currentPlan.days || !Array.isArray(currentPlan.days)) {
      console.warn('[PlanEditor] currentPlan.days is not an array:', currentPlan.days);
      return [];
    }
    
    const allLocations: Array<Location & { dayNumber: number }> = [];
    currentPlan.days.forEach((day) => {
      if (day && day.locations && Array.isArray(day.locations)) {
        day.locations.forEach((location) => {
          if (location && location.coordinates) {
            allLocations.push({ ...location, dayNumber: day.dayNumber || 1 });
          }
        });
      }
    });
    
    console.log('[PlanEditor] Collected locations:', allLocations.length);
    return allLocations;
  }, [currentPlan]);

  // Calculate map center and zoom based on locations
  const calculatedMapView = useMemo(() => {
    if (locationsWithDayInfo.length === 0) {
      return {
        center: [51.505, -0.09] as [number, number], // Default: London
        zoom: 13,
      };
    }

    if (locationsWithDayInfo.length === 1) {
      // Single location - center on it with reasonable zoom
      const loc = locationsWithDayInfo[0];
      return {
        center: [loc.coordinates.lat, loc.coordinates.lng] as [number, number],
        zoom: 15,
      };
    }
    
    // Multiple locations - calculate bounds and fit all points
    const lats = locationsWithDayInfo.map(loc => loc.coordinates.lat);
    const lngs = locationsWithDayInfo.map(loc => loc.coordinates.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate zoom based on bounds
    // Formula: zoom = log2(360 / (maxLng - minLng)) adjusted for latitude
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    
    // Use the larger difference to determine zoom
    const maxDiff = Math.max(latDiff, lngDiff);
    
    // Calculate zoom level (inverse of how spread out the points are)
    // More spread = lower zoom, less spread = higher zoom
    // Increased zoom levels for better visibility of points
    let zoom: number;
    
    if (maxDiff > 10) {
      // Very spread out (country/continent level)
      zoom = 5;
    } else if (maxDiff > 5) {
      // Large region
      zoom = 6;
    } else if (maxDiff > 2) {
      // Medium region
      zoom = 7;
    } else if (maxDiff > 1) {
      // Small region
      zoom = 8;
    } else if (maxDiff > 0.5) {
      // City level
      zoom = 10;
    } else if (maxDiff > 0.2) {
      // District level
      zoom = 12;
    } else if (maxDiff > 0.1) {
      // Neighborhood level
      zoom = 13;
    } else if (maxDiff > 0.05) {
      // Street level
      zoom = 14;
    } else if (maxDiff > 0.02) {
      // Very close points
      zoom = 15;
    } else {
      // Extremely close points
      zoom = 16;
    }
    
    // Add small padding to zoom out slightly so markers aren't exactly at the edge
    // Reduced padding for closer zoom
    zoom = Math.max(4, zoom - 0.5);
    
    return {
      center: [centerLat, centerLng] as [number, number],
      zoom,
    };
  }, [locationsWithDayInfo]);

  // Update map center and zoom when locations change (but not if manually set)
  useEffect(() => {
    if (locationsWithDayInfo.length > 0) {
      setMapCenter(calculatedMapView.center);
      setMapZoom(calculatedMapView.zoom);
    }
  }, [calculatedMapView]);

  const handleLocationClick = (locationId: string) => {
    setSelectedLocationId(locationId);
    
    // Center map on the selected location
    const location = locationsWithDayInfo.find(loc => loc.id === locationId);
    if (location) {
      setMapCenter([location.coordinates.lat, location.coordinates.lng]);
      setMapZoom(15); // Zoom in to show details
    }
  };

  // Auto-scroll to selected location in sidebar
  useEffect(() => {
    if (selectedLocationId && locationRefs.current[selectedLocationId]) {
      const element = locationRefs.current[selectedLocationId];
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
        });
      }
    }
  }, [selectedLocationId]);



  const handleSearchSelect = (result: GeocodingResult, enriched?: EnrichedLocationData) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter([lat, lng]);
    setMapZoom(16);
    const name = result.namedetails?.name || result.display_name.split(',')[0];
    setSearchMarker({
      lat,
      lng,
      name,
      description: enriched?.description,
      wikipediaUrl: enriched?.wikipediaUrl,
      image: enriched?.image,
      imageAttribution: enriched?.imageAttribution,
      openingHours: result.extratags?.opening_hours,
      website: result.extratags?.website || enriched?.website,
    });
    setTimeout(() => setSearchMarker(null), 10000);
  };

  const handleSearchMarkerAdd = (lat: number, lng: number, name: string) => {
    if (!planId || planId === 'new' || !currentPlan) {
      setError('Please create and save a trip plan first before adding locations.');
      return;
    }
    setPendingLocationCoords({ lat, lng });
    setPendingLocationName(name);
    setIsLocationModalOpen(true);
    // Clear search marker after popup has closed to avoid Leaflet _leaflet_pos error on unmount
    setTimeout(() => setSearchMarker(null), 150);
  };

  const handleMapClick = async (lat: number, lng: number, event?: L.LeafletMouseEvent) => {
    // Only show context menu if plan is loaded and not a new plan
    if (!planId || planId === 'new' || !currentPlan) {
      setError('Please create and save a trip plan first before adding markers');
      return;
    }

    // Show context menu at click position
    // Get map container position relative to viewport
    let menuX: number;
    let menuY: number;
    
    if (!event) {
      // Fallback if event is not provided
      menuX = window.innerWidth / 2;
      menuY = window.innerHeight / 2;
    } else {
      const mapContainer = event.target._container;
      const rect = mapContainer.getBoundingClientRect();
      const containerPoint = event.containerPoint;
      menuX = rect.left + containerPoint.x;
      menuY = rect.top + containerPoint.y;
    }
    
    // Set context menu position immediately
    setContextMenu({
      x: menuX,
      y: menuY,
      lat,
      lng,
    });

    // Load location info asynchronously
    setIsLoadingLocationInfo(true);
    setContextMenuLocationInfo(null);
    
    try {
      const locationInfo = await reverseGeocode(lat, lng);
      setContextMenuLocationInfo(locationInfo);
    } catch (err) {
      console.warn('Failed to load location info:', err);
      // Keep locationInfo as null - menu will show "Unknown location"
    } finally {
      setIsLoadingLocationInfo(false);
    }
  };

  // Background enrichment for context menu when location has wikidata
  useEffect(() => {
    if (!contextMenuLocationInfo?.extratags?.wikidata) {
      setContextMenuEnriched(null);
      return;
    }
    const qId = parseWikidataId(contextMenuLocationInfo.extratags!.wikidata);
    if (!qId) return;
    let cancelled = false;
    enrichLocationFromWikidata(qId)
      .then((data) => {
        if (!cancelled) setContextMenuEnriched(data);
      })
      .catch(() => {
        if (!cancelled) setContextMenuEnriched(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contextMenuLocationInfo?.extratags?.wikidata]);

  // Enrich search marker when shown with only basic data (e.g. from chat tile click)
  useEffect(() => {
    const marker = searchMarker;
    if (!marker || marker.description !== undefined || marker.image !== undefined) return;
    const { lat, lng } = marker;
    let cancelled = false;
    (async () => {
      try {
        const geo = await reverseGeocode(lat, lng);
        if (cancelled) return;
        const openingHours = geo?.extratags?.opening_hours;
        const website = geo?.extratags?.website;
        let description: string | undefined;
        let wikipediaUrl: string | undefined;
        let image: string | undefined;
        let imageAttribution: import('../types').ImageAttribution | undefined;
        const qId = geo?.extratags?.wikidata ? parseWikidataId(geo.extratags.wikidata) : null;
        if (qId) {
          const enriched = await enrichLocationFromWikidata(qId);
          if (cancelled) return;
          description = enriched.description;
          wikipediaUrl = enriched.wikipediaUrl;
          image = enriched.image;
          imageAttribution = enriched.imageAttribution;
        }
        setSearchMarker((prev) =>
          prev && prev.lat === lat && prev.lng === lng
            ? {
                ...prev,
                description: description ?? prev.description,
                wikipediaUrl: wikipediaUrl ?? prev.wikipediaUrl,
                image: image ?? prev.image,
                imageAttribution: imageAttribution ?? prev.imageAttribution,
                openingHours: openingHours ?? prev.openingHours,
                website: website ?? prev.website,
              }
            : prev
        );
      } catch {
        if (!cancelled) {
          setSearchMarker((prev) => (prev && prev.lat === lat && prev.lng === lng ? { ...prev } : prev));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchMarker?.lat, searchMarker?.lng, searchMarker?.name]);

  const handleAddMarker = async () => {
    if (!user) {
      setError('You must be logged in to add markers');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Please create a trip plan first before adding markers');
      return;
    }

    if (!contextMenu) return;

    // Store coordinates
    setPendingLocationCoords({
      lat: contextMenu.lat,
      lng: contextMenu.lng,
    });

    // Use existing reverse geocode result if available
    if (contextMenuLocationInfo) {
      const locationName = contextMenuLocationInfo.namedetails?.name || contextMenuLocationInfo.display_name.split(',')[0];
      setPendingLocationName(locationName);
      setPendingLocationGeocodingResult(contextMenuLocationInfo);
    } else {
      try {
        const geocodeResult = await reverseGeocode(contextMenu.lat, contextMenu.lng);
        const locationName = geocodeResult?.display_name.split(',')[0] || 'New Location';
        setPendingLocationName(locationName);
        setPendingLocationGeocodingResult(geocodeResult || null);
      } catch (err) {
        console.warn('Failed to geocode location:', err);
        setPendingLocationName('New Location');
        setPendingLocationGeocodingResult(null);
      }
    }

    // Close context menu and open modal
    setContextMenu(null);
    setIsLocationModalOpen(true);
  };

  const handleAddLocationFromSearch = (result: GeocodingResult, enriched?: EnrichedLocationData) => {
    if (!currentPlan?.days?.length) return;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = result.namedetails?.name || result.display_name.split(',')[0];
    setPendingLocationCoords({ lat, lng });
    setPendingLocationName(name);
    setPendingLocationGeocodingResult(result);
    setPendingLocationEnriched(enriched ?? null);
    setMapCenter([lat, lng]);
    setMapZoom(16);
    setSearchMarker({ lat, lng, name });
    setTimeout(() => setSearchMarker(null), 10000);
    setIsLocationModalOpen(true);
  };

  const handleSubmitLocation = async (formData: LocationFormData) => {
    if (!user) {
      setError('You must be logged in to modify locations');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Please create a trip plan first');
      return;
    }

    const isEditMode = !!editingLocation;

    // For new locations, coordinates are required
    if (!isEditMode && !pendingLocationCoords) {
      setError('Location coordinates are missing');
      return;
    }

    setIsAddingLocation(true);
    setError(null);

    try {
      // Get fresh plan data (in case it was updated)
      let plan = currentPlan;
      if (!plan) {
        plan = await getTripPlan(planId);
        if (!plan) {
          throw new Error('Plan not found. Please refresh the page.');
        }
        await loadPlan(planId);
      }

      // Find target day by dayId
      let targetDay = plan.days.find((day) => day.id === formData.dayId);
      
      if (!targetDay) {
        // If day not found, ensure plan has at least one day
        targetDay = plan.days[0];
        if (!targetDay) {
          await createDay(planId, { dayNumber: 1 });
          const updatedPlan = await getTripPlan(planId);
          if (!updatedPlan || !updatedPlan.days[0]) {
            throw new Error('Failed to create day');
          }
          targetDay = updatedPlan.days[0];
          await loadPlan(planId);
        }
      }

      if (isEditMode && editingLocation) {
        // Update existing location
        const updates: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>> = {
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description?.trim() || undefined,
          image: formData.image,
          imageAttribution: formData.imageAttribution,
          website: formData.website,
          wikipediaUrl: formData.wikipediaUrl,
          wikidataId: formData.wikidataId,
          media: formData.media || [],
          rating: formData.rating,
          openingHours: formData.openingHours?.trim() || undefined,
        };

        // If day changed, we need to handle moving the location
        const currentDay = plan.days.find((day) => 
          day.locations.some((loc) => loc.id === editingLocation.id)
        );

        if (currentDay && currentDay.id !== formData.dayId) {
          // Location is being moved to a different day
          // For now, we'll update it in the current day and note that moving between days
          // requires more complex logic (delete + recreate with new order)
          console.warn('[handleSubmitLocation] Moving location between days not fully implemented');
        }

        const dayIdToUse = currentDay?.id || formData.dayId;
        console.log('[handleSubmitLocation] Updating location...', { planId, dayId: dayIdToUse, locationId: editingLocation.id, updates });
        await updateLocation(planId, dayIdToUse, editingLocation.id, updates);
        console.log('[handleSubmitLocation] Location updated');
      } else {
        // Create new location
        const maxOrder = targetDay.locations.reduce((max, loc) => Math.max(max, loc.order || 0), 0);
        const newOrder = maxOrder + 1;

        const locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> = {
          name: formData.name.trim(),
          category: formData.category,
          coordinates: {
            lat: pendingLocationCoords!.lat,
            lng: pendingLocationCoords!.lng,
          },
          order: newOrder,
          description: formData.description?.trim() || undefined,
          image: formData.image,
          imageAttribution: formData.imageAttribution,
          website: formData.website,
          wikipediaUrl: formData.wikipediaUrl,
          wikidataId: formData.wikidataId,
          media: formData.media || [],
          rating: formData.rating,
          openingHours: formData.openingHours?.trim() || undefined,
        };

        console.log('[handleSubmitLocation] Creating location...', { planId, dayId: targetDay.id, locationData });
        await createLocation(planId, targetDay.id, locationData);
        console.log('[handleSubmitLocation] Location created');
      }

      // Force reload plan (bypass cache)
      await loadPlan(planId, true);
      await refreshPlanCover(planId);

      // Close modal and reset state
      setIsLocationModalOpen(false);
      setEditingLocation(null);
      setPendingLocationCoords(null);
      setPendingLocationName('');
    } catch (err: any) {
      console.error('Error saving location:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'add'} location`);
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleEditLocation = (location: Location) => {
    // Find which day this location belongs to
    const day = currentPlan?.days.find((d) => 
      d.locations.some((loc) => loc.id === location.id)
    );

    if (!day) {
      setError('Could not find day for this location');
      return;
    }

    setEditingLocation(location);
    setPendingLocationCoords({
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
    });
    setPendingLocationName(location.name);
    setIsLocationModalOpen(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!user) {
      setError('You must be logged in to delete locations');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Invalid plan ID');
      return;
    }

    if (!currentPlan) {
      setError('Plan not loaded');
      return;
    }

    // Find which day this location belongs to
    const day = currentPlan.days.find((d) => 
      d.locations.some((loc) => loc.id === locationId)
    );

    if (!day) {
      setError('Could not find day for this location');
      return;
    }

    try {
      console.log('[handleDeleteLocation] Deleting location...', { planId, dayId: day.id, locationId });
      await deleteLocation(planId, day.id, locationId);
      console.log('[handleDeleteLocation] Location deleted');

      // Force reload plan (bypass cache)
      await loadPlan(planId, true);
      await refreshPlanCover(planId);

      // Clear selection if deleted location was selected
      if (selectedLocationId === locationId) {
        setSelectedLocationId(null);
      }
    } catch (err: any) {
      console.error('Error deleting location:', err);
      setError(err.message || 'Failed to delete location');
    }
  };

  const handleAddTransport = (fromLocationId: string, toLocationId: string) => {
    setPendingTransportFrom(fromLocationId);
    setPendingTransportTo(toLocationId);
    setEditingTransport(null);
    setIsTransportModalOpen(true);
  };

  const handleEditTransport = (transport: Transport) => {
    setEditingTransport(transport);
    setPendingTransportFrom(transport.fromLocationId);
    setPendingTransportTo(transport.toLocationId);
    setIsTransportModalOpen(true);
  };

  const handleDeleteTransport = async (transportId: string) => {
    if (!user) {
      setError('You must be logged in to delete transport');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Invalid plan ID');
      return;
    }

    if (!currentPlan) {
      setError('Plan not loaded');
      return;
    }

    // Find which day this transport belongs to
    const day = currentPlan.days.find((d) => 
      d.transports?.some((t) => t.id === transportId)
    );

    if (!day) {
      setError('Could not find day for this transport');
      return;
    }

    try {
      console.log('[handleDeleteTransport] Deleting transport...', { planId, dayId: day.id, transportId });
      await deleteTransport(planId, day.id, transportId);
      console.log('[handleDeleteTransport] Transport deleted');

      // Force reload plan (bypass cache)
      await loadPlan(planId, true);
    } catch (err: any) {
      console.error('Error deleting transport:', err);
      setError(err.message || 'Failed to delete transport');
    }
  };

  const handleLocationMove = async (locationId: string, sourceDayId: string, targetDayId: string, newOrder: number) => {
    if (!user) {
      setError('You must be logged in to move locations');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Invalid plan ID');
      return;
    }

    if (!currentPlan) {
      setError('Plan not loaded');
      return;
    }

    try {
      console.log('[handleLocationMove] Moving location...', { planId, sourceDayId, targetDayId, locationId, newOrder });
      await moveLocation(planId, sourceDayId, locationId, targetDayId, newOrder);
      console.log('[handleLocationMove] Location moved');

      // Force reload plan (bypass cache)
      await loadPlan(planId, true);
      await refreshPlanCover(planId);
    } catch (err: any) {
      console.error('Error moving location:', err);
      setError(err.message || 'Failed to move location');
    }
  };

  const handleSubmitTransport = async (formData: TransportFormData) => {
    if (!user) {
      setError('You must be logged in to modify transport');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Invalid plan ID');
      return;
    }

    if (!pendingTransportFrom || !pendingTransportTo) {
      setError('Transport locations are missing');
      return;
    }

    setIsAddingTransport(true);
    setError(null);

    try {
      // Find which day this transport belongs to
      const day = currentPlan?.days.find((d) => 
        d.locations.some((l) => l.id === pendingTransportFrom) &&
        d.locations.some((l) => l.id === pendingTransportTo)
      );

      if (!day) {
        throw new Error('Could not find day for this transport');
      }

      // Get coordinates for both locations
      const fromLocation = day.locations.find(l => l.id === pendingTransportFrom);
      const toLocation = day.locations.find(l => l.id === pendingTransportTo);

      if (!fromLocation || !toLocation) {
        throw new Error('Could not find locations for transport');
      }

      // Calculate route automatically
      const routeResult = await calculateRoute(
        fromLocation.coordinates,
        toLocation.coordinates,
        formData.type
      );

      const timeString = formatDuration(routeResult.duration);

      if (editingTransport) {
        // Update existing transport
        console.log('[handleSubmitTransport] Updating transport...', { planId, dayId: day.id, transportId: editingTransport.id, formData, routeResult });
        await updateTransport(planId, day.id, editingTransport.id, {
          type: formData.type,
          distance: routeResult.distance,
          time: timeString,
          route: routeResult.route,
          notes: formData.notes,
        });
        console.log('[handleSubmitTransport] Transport updated');
      } else {
        // Create new transport
        console.log('[handleSubmitTransport] Creating transport...', { planId, dayId: day.id, formData, routeResult });
        await createTransport(planId, day.id, {
          fromLocationId: pendingTransportFrom,
          toLocationId: pendingTransportTo,
          type: formData.type,
          distance: routeResult.distance,
          time: timeString,
          route: routeResult.route,
          notes: formData.notes,
        });
        console.log('[handleSubmitTransport] Transport created');
      }

      // Force reload plan (bypass cache)
      await loadPlan(planId, true);

      // Close modal and reset state
      setIsTransportModalOpen(false);
      setEditingTransport(null);
      setPendingTransportFrom(null);
      setPendingTransportTo(null);
    } catch (err: any) {
      console.error('Error saving transport:', err);
      setError(err.message || `Failed to ${editingTransport ? 'update' : 'add'} transport`);
    } finally {
      setIsAddingTransport(false);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setContextMenuLocationInfo(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, [contextMenu]);

  // Error boundary - catch any rendering errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[PlanEditor] Global error caught:', event.error);
      console.error('[PlanEditor] Error stack:', event.error?.stack);
      console.error('[PlanEditor] Current state:', {
        planId,
        hasCurrentPlan: !!currentPlan,
        daysCount: currentPlan?.days?.length,
        locationsCount: locationsWithDayInfo.length,
      });
      setError(`An error occurred: ${event.error?.message || 'Unknown error'}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[PlanEditor] Unhandled promise rejection:', event.reason);
      setError(`An error occurred: ${event.reason?.message || 'Unknown error'}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [planId, currentPlan, locationsWithDayInfo.length]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('[PlanEditor] State update:', {
      planId,
      loading,
      hasCurrentPlan: !!currentPlan,
      currentPlanId: currentPlan?.id,
      locationsCount: locationsWithDayInfo.length,
      error,
    });
  }, [planId, loading, currentPlan, locationsWithDayInfo.length, error]);

  const tamboApiKey = (import.meta.env.VITE_TAMBO_API_KEY ?? '').trim();
  const tamboUserKey = user?.uid ?? 'anonymous';
  const agentDeps = useMemo(
    () => ({
      planId: planId ?? undefined,
      currentPlan,
      loadPlan,
      mapBounds,
      refreshPlanCover,
    }),
    [planId, currentPlan, loadPlan, mapBounds]
  );

  // Keep a ref to agentDeps so context helpers and tools always see the latest values
  // without recreating their object references on every render.
  // Passing a new contextHelpers reference on each render triggers an infinite setState
  // loop inside TamboContextHelpersProvider from the @tambo-ai/react library.
  const agentDepsRef = useRef<TamboAgentDeps>(agentDeps);
  useEffect(() => { agentDepsRef.current = agentDeps; });

  const tamboContextHelpers = useMemo(() => ({
    current_plan_summary: () => buildPlanSummaryContextHelper(agentDepsRef.current)(),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const tamboTools = useMemo(() => buildTamboTools(agentDeps), [agentDeps]);

  // Compute proactive suggestions from current plan state (B4)
  // Rate-limited: only the strongest signal per session (tracked by ref)
  const shownProactiveSuggestionsRef = useRef<Set<string>>(new Set());
  const proactiveSuggestions = useMemo<string[]>(() => {
    if (!currentPlan?.days?.length) return [];
    const suggestions: string[] = [];

    for (const day of currentPlan.days) {
      const locCount = day.locations?.length ?? 0;
      if (locCount >= 4) {
        const key = `busy-day-${day.dayNumber}`;
        if (!shownProactiveSuggestionsRef.current.has(key)) {
          shownProactiveSuggestionsRef.current.add(key);
          suggestions.push(`Day ${day.dayNumber} has ${locCount} stops — is that realistic in one day?`);
          break; // max 1 proactive suggestion per render
        }
      }
    }

    if (suggestions.length === 0) {
      const day1 = currentPlan.days.find((d) => d.dayNumber === 1);
      if (day1 && (day1.locations?.length ?? 0) === 0 && currentPlan.days.length > 0) {
        const key = 'empty-day-1';
        if (!shownProactiveSuggestionsRef.current.has(key)) {
          shownProactiveSuggestionsRef.current.add(key);
          suggestions.push('Day 1 is empty — suggest some arrival-day activities?');
        }
      }
    }

    if (suggestions.length === 0 && currentPlan.days.length >= 2) {
      for (let i = 0; i < currentPlan.days.length - 1; i++) {
        const dayA = currentPlan.days[i];
        const dayB = currentPlan.days[i + 1];
        const cityA = dayA.locations?.[0]?.name;
        const cityB = dayB.locations?.[0]?.name;
        if (cityA && cityB && cityA === cityB) {
          const key = `duplicate-city-${i}`;
          if (!shownProactiveSuggestionsRef.current.has(key)) {
            shownProactiveSuggestionsRef.current.add(key);
            suggestions.push(
              `Days ${dayA.dayNumber} and ${dayB.dayNumber} both start in ${cityA} — optimize the route order?`
            );
            break;
          }
        }
      }
    }

    return suggestions;
  }, [currentPlan]);

  const layoutContent = (
    <AppLayout
      showHeader={true}
      showSidebar={true}
      showChatPanel={!!tamboApiKey}
      isChatOpen={isChatOpen}
      proactiveSuggestions={isChatOpen ? proactiveSuggestions : undefined}
      headerProps={{
        onLocationSelect: handleSearchSelect,
        onAddLocationFromSearch: handleAddLocationFromSearch,
        onPlanEdit: () => setIsPlanModalOpen(true),
        onChatToggle: tamboApiKey ? () => setIsChatOpen(!isChatOpen) : undefined,
        isChatOpen: tamboApiKey ? isChatOpen : false,
        mapBounds: mapBounds || undefined,
      }}
      sidebarProps={{
        selectedLocationId,
        onLocationClick: handleLocationClick,
        onLocationEdit: handleEditLocation,
        onLocationDelete: handleDeleteLocation,
        onTransportAdd: handleAddTransport,
        onTransportEdit: handleEditTransport,
        onTransportDelete: handleDeleteTransport,
        onLocationMove: handleLocationMove,
        allDays: currentPlan?.days || [],
        locationRefs,
      }}
    >
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        {error && (
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', zIndex: 10001 }}>
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onClose={() => setError(null)}
            />
          </div>
        )}
        {showWizardToast && (() => {
          const wa = routerLocation.state?.wizardAnswers;
          const destLabel = wa?.destination ? wa.destination : null;
          const daysLabel = wa?.days ? `${wa.days}-day ` : '';
          const toastTitle = destLabel
            ? `Your ${daysLabel}${destLabel} trip is live!`
            : 'Your trip is ready to explore.';
          return (
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10001, minWidth: '320px', maxWidth: '520px' }}>
              <InlineNotification
                kind="success"
                title={toastTitle}
                subtitle="The co-pilot is open on the right — ask it anything about your plan, or start adding spots directly on the map."
                onClose={() => setShowWizardToast(false)}
              />
            </div>
          );
        })()}
        {(planId && planId !== 'new' && loading && !currentPlan) ? (
          <div 
            style={{ 
              height: '100%', 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f4f4f4'
            }}
          >
            <Loading 
              description="Loading trip plan..." 
              withOverlay={false}
            />
          </div>
        ) : (
          <>
            <MapView
              key={planId ?? 'new'}
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              locations={locationsWithDayInfo || []}
              days={currentPlan?.days || []}
              selectedLocationId={selectedLocationId}
              onLocationClick={handleLocationClick}
              onMapClick={handleMapClick}
              searchMarker={searchMarker}
              onSearchMarkerClear={onSearchMarkerClear}
              onSearchMarkerAdd={handleSearchMarkerAdd}
              onBoundsChange={handleBoundsChange}
            />
            {contextMenu && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                locationInfo={contextMenuLocationInfo}
                enriched={contextMenuEnriched}
                isLoadingLocationInfo={isLoadingLocationInfo}
                onAddMarker={handleAddMarker}
                onClose={() => {
                  setContextMenu(null);
                  setContextMenuLocationInfo(null);
                  setContextMenuEnriched(null);
                }}
              />
            )}
            {isLocationModalOpen && currentPlan && (pendingLocationCoords || editingLocation) && (
              <LocationFormModal
                open={isLocationModalOpen}
                onClose={() => {
                  setIsLocationModalOpen(false);
                  setEditingLocation(null);
                  setPendingLocationCoords(null);
                  setPendingLocationName('');
                  setPendingLocationGeocodingResult(null);
                  setPendingLocationEnriched(null);
                }}
                onSubmit={handleSubmitLocation}
                initialData={editingLocation ? {
                  name: editingLocation.name,
                  category: editingLocation.category,
                  dayId: currentPlan.days.find((d) => 
                    d.locations.some((loc) => loc.id === editingLocation.id)
                  )?.id || currentPlan.days[0]?.id || '',
                  description: editingLocation.description,
                  image: editingLocation.image,
                  imageAttribution: editingLocation.imageAttribution,
                  website: editingLocation.website,
                  wikipediaUrl: editingLocation.wikipediaUrl,
                  wikidataId: editingLocation.wikidataId,
                  media: editingLocation.media,
                  rating: editingLocation.rating,
                  openingHours: editingLocation.openingHours,
                } : {
                  name: pendingLocationName,
                  category: pendingLocationGeocodingResult
                    ? geocodingResultToCategory(pendingLocationGeocodingResult)
                    : 'other',
                  dayId: currentPlan.days[0]?.id || '',
                  ...(pendingLocationEnriched && {
                    description: pendingLocationEnriched.description,
                    image: pendingLocationEnriched.image,
                    imageAttribution: pendingLocationEnriched.imageAttribution,
                    wikipediaUrl: pendingLocationEnriched.wikipediaUrl,
                  }),
                }}
                geocodingResult={editingLocation ? undefined : pendingLocationGeocodingResult}
                isSubmitting={isAddingLocation}
                isEditMode={!!editingLocation}
                locationId={editingLocation?.id}
                planId={planId}
              />
            )}
            {isPlanModalOpen && currentPlan && (
              <TripPlanFormModal
                open={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                onSubmit={handleUpdatePlan}
                initialData={{
                  title: currentPlan.title,
                  description: currentPlan.description,
                  startDate: currentPlan.startDate,
                  endDate: currentPlan.endDate,
                }}
                isSubmitting={isUpdatingPlan}
                isEditMode={true}
                planId={planId ?? undefined}
                onDeletePlan={
                  planId && planId !== 'new'
                    ? async (id) => {
                        await deletePlan(id);
                        setIsPlanModalOpen(false);
                        navigate('/dashboard');
                      }
                    : undefined
                }
              />
            )}
            {isTransportModalOpen && currentPlan && pendingTransportFrom && pendingTransportTo && (
              <TransportFormModal
                open={isTransportModalOpen}
                onClose={() => {
                  setIsTransportModalOpen(false);
                  setEditingTransport(null);
                  setPendingTransportFrom(null);
                  setPendingTransportTo(null);
                }}
                onSubmit={handleSubmitTransport}
                initialData={editingTransport ? {
                  type: editingTransport.type,
                  notes: editingTransport.notes,
                } : undefined}
                isSubmitting={isAddingTransport}
                isEditMode={!!editingTransport}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );

  if (!tamboApiKey) {
    return layoutContent;
  }

  return (
    <TamboProvider
      apiKey={tamboApiKey}
      userKey={tamboUserKey}
      tools={tamboTools}
      contextHelpers={tamboContextHelpers}
      components={tamboChatComponents}
    >
      <ChatMapProvider
        showLocationOnMap={(lat, lng, name) => {
          setSearchMarker({ lat, lng, name });
          setTimeout(() => setSearchMarker(null), 10000);
        }}
      >
        {layoutContent}
      </ChatMapProvider>
    </TamboProvider>
  );

  async function handleUpdatePlan(formData: TripPlanFormData) {
    if (!user) {
      setError('You must be logged in to update plans');
      return;
    }

    if (!planId || planId === 'new') {
      setError('Invalid plan ID');
      return;
    }

    setIsUpdatingPlan(true);
    setError(null);

    try {
      console.log('[handleUpdatePlan] Updating plan...', { planId, formData });
      await updateTripPlan(planId, {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      console.log('[handleUpdatePlan] Plan updated');

      // Force reload plan (bypass cache)
      await loadPlan(planId, true);

      // Close modal
      setIsPlanModalOpen(false);
    } catch (err: any) {
      console.error('Error updating plan:', err);
      setError(err.message || 'Failed to update plan');
    } finally {
      setIsUpdatingPlan(false);
    }
  }
}

export default PlanEditor;

