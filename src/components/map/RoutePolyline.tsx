import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Location, Transport } from '../../types';
import { getTransportIconPath } from '../../utils/transportIcons';
import { calculateDistance, formatDuration } from '../../services/routing';
import { getDayColor } from '../../utils/dayColors';

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
  return (bearing + 360) % 360;
}

/**
 * Component to draw route polyline between locations in a day.
 * Transport routes use the day color; no-transport arcs use a subtle dashed line.
 */
function RoutePolyline({ locations, transports, dayNumber }: RoutePolylineProps) {
  try {
    if (!locations || !Array.isArray(locations)) {
      return null;
    }

    const validLocations = locations.filter(loc =>
      loc &&
      loc.coordinates &&
      typeof loc.coordinates.lat === 'number' &&
      typeof loc.coordinates.lng === 'number' &&
      !isNaN(loc.coordinates.lat) &&
      !isNaN(loc.coordinates.lng)
    );

    const sortedLocations = [...validLocations].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sortedLocations.length < 2) {
      return null;
    }

    const dayColor = getDayColor(dayNumber);

    const getTransportBetween = (fromLocationId: string, toLocationId: string): Transport | undefined => {
      return transports?.find(
        t => t.fromLocationId === fromLocationId && t.toLocationId === toLocationId
      );
    };

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
            const routePoints = segment.transport.route || [fromCoords, toCoords];

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

            const latlngs = positions.map(pos => L.latLng(pos[0], pos[1]));

            const key = `route-${dayNumber}-${segment.from.id}-${segment.to.id}-${index}`;

            const midIndex = Math.floor(latlngs.length / 2);
            const midPoint = latlngs[midIndex] || L.latLng(
              (fromCoords[0] + toCoords[0]) / 2,
              (fromCoords[1] + toCoords[1]) / 2
            );

            const arrowIndex = Math.max(1, Math.floor(latlngs.length * 0.5));
            const arrowPoint = latlngs[arrowIndex] || latlngs[latlngs.length - 1] || L.latLng(
              (fromCoords[0] + toCoords[0]) / 2,
              (fromCoords[1] + toCoords[1]) / 2
            );

            const distance = segment.transport.distance || calculateDistance(
              segment.from.coordinates,
              segment.to.coordinates
            );
            const time = segment.transport.time || formatDuration(
              Math.round((distance / (travelType === 'car' ? 50 : travelType === 'walking' ? 5 : travelType === 'public-transport' ? 30 : 15)) * 3600)
            );

            const prevPoint = latlngs[Math.max(0, arrowIndex - 1)] || L.latLng(fromCoords[0], fromCoords[1]);
            const arrowBearing = calculateBearing(prevPoint, arrowPoint);

            return (
              <>
                <Polyline
                  key={key}
                  positions={positions}
                  pathOptions={{
                    color: dayColor,
                    weight: 3,
                    opacity: 0.75,
                    fillOpacity: 0,
                  }}
                />
                {/* Transport icon at midpoint */}
                {travelType && (
                  <Marker
                    key={`icon-${key}`}
                    position={[midPoint.lat, midPoint.lng]}
                    icon={L.divIcon({
                      html: `
                        <div class="transport-icon-marker-inner" style="border: 2px solid ${dayColor};">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="${dayColor}">
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
                {/* Direction arrow */}
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
                        border-top: 8px solid ${dayColor};
                        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
                        position: relative;
                      "></div>
                    `,
                    className: 'direction-arrow-marker',
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                  })}
                  interactive={false}
                />
                {/* Distance + time label */}
                <Marker
                  key={`label-${key}`}
                  position={[midPoint.lat, midPoint.lng]}
                  icon={L.divIcon({
                    html: `<div class="route-label">${distance.toFixed(1)} km · ${time}</div>`,
                    className: 'route-label-marker',
                    iconSize: [100, 30],
                    iconAnchor: [50, 30],
                  })}
                  interactive={false}
                />
              </>
            );
          } else {
            // No transport — subtle dashed arc
            const midLat = (fromCoords[0] + toCoords[0]) / 2;
            const midLng = (fromCoords[1] + toCoords[1]) / 2;

            const dx = toCoords[1] - fromCoords[1];
            const dy = toCoords[0] - fromCoords[0];
            const arcDistance = Math.sqrt(dx * dx + dy * dy);
            const offset = arcDistance * 0.3;

            const perpX = -dy / arcDistance;
            const perpY = dx / arcDistance;

            const arcMidLat = midLat + perpX * offset;
            const arcMidLng = midLng + perpY * offset;

            const arcPoints = [
              L.latLng(fromCoords[0], fromCoords[1]),
              L.latLng(arcMidLat, arcMidLng),
              L.latLng(toCoords[0], toCoords[1]),
            ];

            const key = `route-${dayNumber}-${segment.from.id}-${segment.to.id}-${index}`;

            const distance = calculateDistance(
              segment.from.coordinates,
              segment.to.coordinates
            );

            const midPoint = L.latLng(
              (fromCoords[0] + toCoords[0]) / 2,
              (fromCoords[1] + toCoords[1]) / 2
            );

            const arrowPointIndex = Math.floor(arcPoints.length * 0.5);
            const arrowPoint = arcPoints[arrowPointIndex] || arcPoints[arcPoints.length - 1] || midPoint;
            const prevArcPoint = arcPoints[Math.max(0, arrowPointIndex - 1)] || L.latLng(fromCoords[0], fromCoords[1]);
            const arrowBearing = calculateBearing(prevArcPoint, arrowPoint);

            // Dashed arc color: day color at reduced opacity
            const dashedColor = dayColor;

            return (
              <>
                <Polyline
                  key={key}
                  positions={arcPoints}
                  color={dashedColor}
                  weight={2}
                  opacity={0.4}
                  dashArray="8, 6"
                />
                {/* Direction arrow for dashed line */}
                <Marker
                  key={`arrow-${key}`}
                  position={[arrowPoint.lat, arrowPoint.lng]}
                  icon={L.divIcon({
                    html: `
                      <div style="
                        transform: rotate(${arrowBearing}deg);
                        width: 0;
                        height: 0;
                        border-left: 4px solid transparent;
                        border-right: 4px solid transparent;
                        border-top: 7px solid ${dashedColor};
                        opacity: 0.5;
                        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
                        position: relative;
                      "></div>
                    `,
                    className: 'direction-arrow-marker',
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                  })}
                  interactive={false}
                />
                {/* Distance label */}
                <Marker
                  key={`label-${key}`}
                  position={[midPoint.lat, midPoint.lng]}
                  icon={L.divIcon({
                    html: `<div class="route-label">${distance.toFixed(1)} km</div>`,
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
    return null;
  }
}

export default RoutePolyline;
