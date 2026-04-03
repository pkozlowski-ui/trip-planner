import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Location, Transport } from '../../types';
import { getTransportIconPath } from '../../utils/transportIcons';
import { calculateDistance, formatDuration } from '../../services/routing';

interface RoutePolylineProps {
  locations: Location[];
  transports: Transport[];
  dayNumber: number;
}

/**
 * Calculate bearing (direction) between two lat/lng points in degrees
 * Returns bearing from 0 to 360 degrees (0 = North, 90 = East, etc.)
 */
function calculateBearing(from: L.LatLng, to: L.LatLng): number {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Component to draw route polyline between locations in a day
 * Routes are drawn in order: location 1 -> 2 -> 3 -> ...
 * Uses Transport objects if available, otherwise draws dashed arc line
 */
function RoutePolyline({ locations, transports, dayNumber }: RoutePolylineProps) {
  try {
    // Validate locations array
    if (!locations || !Array.isArray(locations)) {
      return null;
    }

    // Filter valid locations with coordinates
    const validLocations = locations.filter(loc => 
      loc && 
      loc.coordinates && 
      typeof loc.coordinates.lat === 'number' && 
      typeof loc.coordinates.lng === 'number' &&
      !isNaN(loc.coordinates.lat) &&
      !isNaN(loc.coordinates.lng)
    );

    // Sort locations by order
    const sortedLocations = [...validLocations].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Don't render if less than 2 locations
    if (sortedLocations.length < 2) {
      return null;
    }

  // Helper function to get transport between two locations
  const getTransportBetween = (fromLocationId: string, toLocationId: string): Transport | undefined => {
    return transports?.find(
      t => t.fromLocationId === fromLocationId && t.toLocationId === toLocationId
    );
  };

  // Create route segments between consecutive locations
  const routeSegments: Array<{
    from: Location;
    to: Location;
    transport?: Transport;
    hasTransport: boolean;
  }> = [];

  for (let i = 0; i < sortedLocations.length - 1; i++) {
    const from = sortedLocations[i];
    const to = sortedLocations[i + 1];
    
    const transport = getTransportBetween(from.id, to.id);
    
    routeSegments.push({ from, to, transport, hasTransport: !!transport });
  }

  return (
    <>
      {routeSegments.map((segment, index) => {
        const fromCoords: [number, number] = [
          segment.from.coordinates.lat,
          segment.from.coordinates.lng,
        ];
        const toCoords: [number, number] = [
          segment.to.coordinates.lat,
          segment.to.coordinates.lng,
        ];

        const hasTransport = segment.hasTransport && segment.transport;
        const travelType = segment.transport?.type;

        if (hasTransport && segment.transport) {
          // Has transport - draw continuous line with route points if available
          const routePoints = segment.transport.route || [fromCoords, toCoords];
          
          // Convert route points to [lat, lng] format for React-Leaflet
          const positions: [number, number][] = routePoints.map((coord) => {
            if (Array.isArray(coord)) {
              return [coord[0], coord[1]] as [number, number];
            } else if (coord && typeof coord === 'object' && 'lat' in coord && 'lng' in coord) {
              return [coord.lat, coord.lng] as [number, number];
            } else {
              return fromCoords;
            }
          }).filter(pos => pos && pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]));

          if (positions.length < 2) {
            positions.push(toCoords);
          }
          
          // Also create L.LatLng for midpoint calculations
          const latlngs = positions.map(pos => L.latLng(pos[0], pos[1]));

          const key = `route-${dayNumber}-${segment.from.id}-${segment.to.id}-${index}`;
          
          // Calculate midpoint for icon and label (middle of the route)
          const midIndex = Math.floor(latlngs.length / 2);
          const midPoint = latlngs[midIndex] || L.latLng(
            (fromCoords[0] + toCoords[0]) / 2,
            (fromCoords[1] + toCoords[1]) / 2
          );

          // Calculate arrow position (50% along the route, in the middle)
          const arrowIndex = Math.max(1, Math.floor(latlngs.length * 0.5));
          const arrowPoint = latlngs[arrowIndex] || latlngs[latlngs.length - 1] || L.latLng(
            (fromCoords[0] + toCoords[0]) / 2,
            (fromCoords[1] + toCoords[1]) / 2
          );

          // Calculate distance and time for label (before arrow bearing calculation)
          const distance = segment.transport.distance || calculateDistance(
            segment.from.coordinates,
            segment.to.coordinates
          );
          // Use transport.time if available, otherwise calculate from distance
          const time = segment.transport.time || formatDuration(
            Math.round((distance / (travelType === 'car' ? 50 : travelType === 'walking' ? 5 : travelType === 'public-transport' ? 30 : 15)) * 3600)
          );

          // Calculate bearing for arrow direction
          const prevPoint = latlngs[Math.max(0, arrowIndex - 1)] || L.latLng(fromCoords[0], fromCoords[1]);
          const arrowBearing = calculateBearing(prevPoint, arrowPoint);

          return (
            <>
              <Polyline
                key={key}
                positions={positions}
                pathOptions={{
                  color: '#4285F4',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0,
                }}
              />
              {/* Transport icon marker at midpoint with white background */}
              {travelType && (
                <Marker
                  key={`icon-${key}`}
                  position={[midPoint.lat, midPoint.lng]}
                  icon={L.divIcon({
                    html: `
                      <div style="
                        background-color: #ffffff;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        border: 2px solid #4285F4;
                        z-index: 1000;
                      ">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="#4285F4">
                          <path d="${getTransportIconPath(travelType)}"/>
                        </svg>
                      </div>
                    `,
                    className: 'transport-icon-marker',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                  interactive={false}
                />
              )}
              {/* Direction arrow marker */}
              <Marker
                key={`arrow-${key}`}
                position={[arrowPoint.lat, arrowPoint.lng]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      transform: rotate(${arrowBearing}deg);
                      width: 0;
                      height: 0;
                      border-left: 5px solid transparent;
                      border-right: 5px solid transparent;
                      border-top: 8px solid #4285F4;
                      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
                      position: relative;
                    "></div>
                  `,
                  className: 'direction-arrow-marker',
                  iconSize: [10, 10],
                  iconAnchor: [5, 5],
                })}
                interactive={false}
              />
              {/* Distance and time label - positioned below the icon */}
              <Marker
                key={`label-${key}`}
                position={[midPoint.lat, midPoint.lng]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      background-color: rgba(255, 255, 255, 0.95);
                      border: 1px solid #d0d0d0;
                      border-radius: 4px;
                      padding: 4px 8px;
                      font-size: 11px;
                      font-weight: 500;
                      color: #161616;
                      white-space: nowrap;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                    ">
                      ${distance.toFixed(1)} km • ${time}
                    </div>
                  `,
                  className: 'route-label-marker',
                  iconSize: [100, 30],
                  iconAnchor: [50, 30], // Anchor at bottom center, positioned below icon
                })}
                interactive={false}
              />
            </>
          );
        } else {
          // No transport - draw dashed arc line (curved)
          // Create arc points for curved dashed line
          const midLat = (fromCoords[0] + toCoords[0]) / 2;
          const midLng = (fromCoords[1] + toCoords[1]) / 2;
          
          // Calculate perpendicular offset for arc
          const dx = toCoords[1] - fromCoords[1];
          const dy = toCoords[0] - fromCoords[0];
          const arcDistance = Math.sqrt(dx * dx + dy * dy);
          const offset = arcDistance * 0.3; // Arc height
          
          // Perpendicular vector
          const perpX = -dy / arcDistance;
          const perpY = dx / arcDistance;
          
          // Arc midpoint
          const arcMidLat = midLat + perpX * offset;
          const arcMidLng = midLng + perpY * offset;
          
          // Create arc points
          const arcPoints = [
            L.latLng(fromCoords[0], fromCoords[1]),
            L.latLng(arcMidLat, arcMidLng),
            L.latLng(toCoords[0], toCoords[1]),
          ];

          const key = `route-${dayNumber}-${segment.from.id}-${segment.to.id}-${index}`;
          const color = '#6f6f6f'; // Gray for no transport

          // Calculate distance for label (no transport - only distance)
          const distance = calculateDistance(
            segment.from.coordinates,
            segment.to.coordinates
          );

          // Calculate midpoint for label
          const midPoint = L.latLng(
            (fromCoords[0] + toCoords[0]) / 2,
            (fromCoords[1] + toCoords[1]) / 2
          );

          // Calculate arrow position (50% along the arc, in the middle)
          const arrowPointIndex = Math.floor(arcPoints.length * 0.5);
          const arrowPoint = arcPoints[arrowPointIndex] || arcPoints[arcPoints.length - 1] || midPoint;
          const prevArcPoint = arcPoints[Math.max(0, arrowPointIndex - 1)] || L.latLng(fromCoords[0], fromCoords[1]);
          const arrowBearing = calculateBearing(prevArcPoint, arrowPoint);

          return (
            <>
              <Polyline
                key={key}
                positions={arcPoints}
                color={color}
                weight={2}
                opacity={0.5}
                dashArray="10, 5"
              />
              {/* Direction arrow marker for dashed line */}
              <Marker
                key={`arrow-${key}`}
                position={[arrowPoint.lat, arrowPoint.lng]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      transform: rotate(${arrowBearing}deg);
                      width: 0;
                      height: 0;
                      border-left: 5px solid transparent;
                      border-right: 5px solid transparent;
                      border-top: 8px solid #6f6f6f;
                      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
                      position: relative;
                    "></div>
                  `,
                  className: 'direction-arrow-marker',
                  iconSize: [10, 10],
                  iconAnchor: [5, 5],
                })}
                interactive={false}
              />
              {/* Distance label (no time when no transport) */}
              <Marker
                key={`label-${key}`}
                position={[midPoint.lat, midPoint.lng]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      background-color: rgba(255, 255, 255, 0.95);
                      border: 1px solid #d0d0d0;
                      border-radius: 4px;
                      padding: 4px 8px;
                      font-size: 11px;
                      font-weight: 500;
                      color: #161616;
                      white-space: nowrap;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                    ">
                      ${distance.toFixed(1)} km
                    </div>
                  `,
                  className: 'route-label-marker',
                  iconSize: [60, 30],
                  iconAnchor: [30, 15],
                })}
                interactive={false}
              />
            </>
          );
        }
      })}
    </>
  );
  } catch (error) {
    console.error('[RoutePolyline] Error rendering route:', error);
    console.error('[RoutePolyline] Locations:', locations);
    console.error('[RoutePolyline] Day number:', dayNumber);
    return null;
  }
}

export default RoutePolyline;
