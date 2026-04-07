import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import { useEffect, useMemo, useRef, memo } from 'react';
import L from 'leaflet';
import { Button } from '@carbon/react';
import 'leaflet/dist/leaflet.css';
import { Location, Day } from '../../types';
import LocationMarker from './LocationMarker';
import MapClickHandler from './MapClickHandler';
import RoutePolyline from './RoutePolyline';

// Search marker component with auto-open popup
interface SearchMarkerProps {
  lat: number;
  lng: number;
  name: string;
  description?: string;
  wikipediaUrl?: string;
  image?: string;
  imageAttribution?: { author?: string; license?: string; sourceUrl?: string };
  openingHours?: string;
  website?: string;
  onClear: () => void;
  onAddToTrip?: (lat: number, lng: number, name: string) => void;
}

function SearchMarkerWithPopup({
  lat,
  lng,
  name,
  description,
  wikipediaUrl,
  image,
  imageAttribution,
  openingHours,
  website,
  onClear: _onClear,
  onAddToTrip,
}: SearchMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  // Auto-open popup when marker appears
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [lat, lng]);

  const icon = useMemo(() => L.divIcon({
    className: 'search-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div class="search-marker-pulse"></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background-color: var(--cds-focus, #0f62fe);
          border-radius: 50%;
          border: 3px solid var(--cds-layer-01, #ffffff);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), []);

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={icon}
    >
      <Popup>
        <div style={{
          padding: '0.5rem',
          fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
          minWidth: '200px',
          maxWidth: '280px',
        }}>
          {image && (
            <div style={{ marginBottom: '0.5rem', borderRadius: 4, overflow: 'hidden' }}>
              <img src={image} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              {imageAttribution?.sourceUrl && (
                <a
                  href={imageAttribution.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="search-popup-attribution"
                >
                  {imageAttribution.author ? `© ${imageAttribution.author}` : 'Source'}
                </a>
              )}
            </div>
          )}
          <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '14px', color: 'var(--cds-text-primary, #161616)' }}>
            {name}
          </div>
          {description && (
            <p className="search-popup-description">
              {description.length > 200 ? `${description.slice(0, 200).trim()}…` : description}
            </p>
          )}
          {openingHours && (
            <p className="search-popup-hours">🕐 {openingHours}</p>
          )}
          {(website || wikipediaUrl) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="search-popup-link"
                >
                  Website →
                </a>
              )}
              {wikipediaUrl && (
                <a
                  href={wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="search-popup-link"
                >
                  Wikipedia →
                </a>
              )}
            </div>
          )}
          {onAddToTrip && (
            <Button
              kind="primary"
              size="sm"
              onClick={() => onAddToTrip(lat, lng, name)}
            >
              Add to trip
            </Button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// Bounds interface for search biasing
export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

// Component to update map view when center/zoom changes
function ChangeView({ 
  center, 
  zoom, 
  locations 
}: { 
  center: [number, number]; 
  zoom: number;
  locations?: Location[];
}) {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  
  // Create a stable key from location IDs and coordinates to prevent unnecessary re-renders
  const locationsKey = useMemo(() => {
    if (!locations || locations.length === 0) return '';
    return locations
      .filter(loc => loc && loc.coordinates)
      .map(loc => `${loc.id}:${loc.coordinates.lat.toFixed(4)},${loc.coordinates.lng.toFixed(4)}`)
      .join('|');
  }, [locations]);
  
  useEffect(() => {
    // Only fit bounds once on initial load or when locations actually change
    if (hasInitializedRef.current && !locationsKey) return;
    
    // If we have multiple locations, use fitBounds for better zoom
    if (locations && locations.length > 1) {
      const validLocations = locations.filter(loc => 
        loc && 
        loc.coordinates && 
        typeof loc.coordinates.lat === 'number' && 
        typeof loc.coordinates.lng === 'number'
      );
      
      if (validLocations.length > 1) {
        const latlngs = validLocations.map(loc => 
          L.latLng(loc.coordinates.lat, loc.coordinates.lng)
        );
        const bounds = L.latLngBounds(latlngs);
        try {
          // Use fitBounds with minimal padding for closer zoom
          // Only fit on initial load, not on every render
          if (!hasInitializedRef.current) {
            map.fitBounds(bounds, {
              padding: [10, 10],
              maxZoom: 17,
            });
            hasInitializedRef.current = true;
          }
          return;
        } catch (err) {
          console.warn('Error fitting bounds, using setView:', err);
        }
      }
    }
    
    // Fallback to setView for single location or if fitBounds fails
    if (!hasInitializedRef.current) {
      map.setView(center, zoom);
      hasInitializedRef.current = true;
    }
  }, [map, center, zoom, locationsKey]);
  
  return null;
}

// Component to track map bounds changes
function BoundsTracker({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!onBoundsChange) return;
    
    const updateBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
    };
    
    // Initial bounds
    updateBounds();
    
    // Track changes
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    
    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, onBoundsChange]);
  
  return null;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  locations?: Location[];
  days?: Day[]; // Days with locations for route visualization
  selectedLocationId?: string | null;
  onLocationClick?: (locationId: string) => void;
  onMapClick?: (lat: number, lng: number, event?: L.LeafletMouseEvent) => void;
  searchMarker?: {
    lat: number;
    lng: number;
    name: string;
    description?: string;
    wikipediaUrl?: string;
    image?: string;
    imageAttribution?: { author?: string; license?: string; sourceUrl?: string };
    openingHours?: string;
    website?: string;
  } | null;
  onSearchMarkerClear?: () => void;
  onSearchMarkerAdd?: (lat: number, lng: number, name: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void; // Track map bounds for location-biased search
}

/**
 * Minimalistyczny styl mapy zgodny z designem referencyjnym:
 * - Light gray background dla lądu
 * - Dark blue dla wody
 * - Subtelne cieniowanie
 * - Minimalne detale i kolory
 */
function MapView({ 
  center = [51.505, -0.09], // Default: London
  zoom = 13,
  height = '400px',
  locations = [],
  days = [],
  selectedLocationId = null,
  onLocationClick,
  onMapClick,
  searchMarker,
  onSearchMarkerClear,
  onSearchMarkerAdd,
  onBoundsChange,
}: MapViewProps) {
  // Validate locations array
  const validLocations = Array.isArray(locations) ? locations.filter(loc => 
    loc && 
    loc.id && 
    loc.coordinates && 
    typeof loc.coordinates.lat === 'number' && 
    typeof loc.coordinates.lng === 'number'
  ) : [];

  // Always use CartoDB Positron - minimalist light style with labels
  const tileConfig = {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };

  return (
    <div style={{ width: '100%', height, borderRadius: '4px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} locations={validLocations} />
        <BoundsTracker onBoundsChange={onBoundsChange} />
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          subdomains="abcd"
          maxZoom={19}
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {/* Draw routes for each day */}
        {days && Array.isArray(days) && days.map((day) => {
          if (!day || !day.locations || !Array.isArray(day.locations) || day.locations.length < 2) {
            return null;
          }
          return (
            <RoutePolyline
              key={`route-day-${day.id ?? day.dayNumber ?? `day-${day.dayNumber ?? 0}`}`}
              locations={day.locations}
              transports={day.transports || []}
              dayNumber={day.dayNumber || 1}
            />
          );
        })}
        {/* Draw markers for all locations */}
        {validLocations.map((location) => {
          // Location should have dayNumber attached (from PlanEditor)
          const locationWithDay = location as Location & { dayNumber?: number };
          const dayNumber = locationWithDay.dayNumber || 1;
          
          // Find the day this location belongs to and get its order within that day
          const day = days.find(d => d.dayNumber === dayNumber);
          let order = location.order || 1;
          
          if (day && day.locations && Array.isArray(day.locations)) {
            // Sort locations by order and find index
            const sortedDayLocations = [...day.locations].sort((a, b) => (a.order || 0) - (b.order || 0));
            const locationIndex = sortedDayLocations.findIndex(loc => loc.id === location.id);
            if (locationIndex !== -1) {
              // Use 1-based index (first location = 1, second = 2, etc.)
              order = locationIndex + 1;
            }
          }
          
          return (
            <LocationMarker
              key={location.id}
              location={location}
              order={order}
              dayNumber={dayNumber}
              onMarkerClick={onLocationClick}
              isHighlighted={selectedLocationId === location.id}
            />
          );
        })}
        
        {/* Search result marker - pulsing indicator with auto-open popup */}
        {searchMarker && (
          <SearchMarkerWithPopup
            lat={searchMarker.lat}
            lng={searchMarker.lng}
            name={searchMarker.name}
            description={searchMarker.description}
            wikipediaUrl={searchMarker.wikipediaUrl}
            image={searchMarker.image}
            imageAttribution={searchMarker.imageAttribution}
            openingHours={searchMarker.openingHours}
            website={searchMarker.website}
            onClear={onSearchMarkerClear || (() => {})}
            onAddToTrip={onSearchMarkerAdd}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default memo(MapView);

