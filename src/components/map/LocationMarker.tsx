import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Location } from '../../types';
import { getDayColor } from '../../utils/dayColors';
import { enrichLocationFromWikidata } from '../../services/wikimedia';
import LocationPopup from './LocationPopup';

interface LocationMarkerProps {
  location: Location;
  order: number;
  dayNumber: number;
  onMarkerClick?: (locationId: string) => void;
  isHighlighted?: boolean;
}

/** Minimal circle marker: solid day-color circle with order number in centre. */
function getMarkerIcon(dayNumber: number, order: number, isHighlighted: boolean) {
  const color = getDayColor(dayNumber);

  const html = `
    <div class="custom-marker-pin${isHighlighted ? ' custom-marker-pin--highlighted' : ''}"
         style="background-color: ${color};">
      <span class="custom-marker-num">${order}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function LocationMarker({ location, order, dayNumber, onMarkerClick, isHighlighted = false }: LocationMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const [popupImage, setPopupImage] = useState<string | undefined>(undefined);
  const [popupImageAttribution, setPopupImageAttribution] = useState<Location['imageAttribution']>(undefined);
  const [popupImageLoading, setPopupImageLoading] = useState(false);
  const enrichedRef = useRef(false);

  const icon = useMemo(
    () => getMarkerIcon(dayNumber, order, isHighlighted),
    [dayNumber, order, isHighlighted]
  );

  const dayColor = useMemo(() => getDayColor(dayNumber), [dayNumber]);

  const triggerEnrichment = useCallback(() => {
    if (location.image || !location.wikidataId || enrichedRef.current) return;
    enrichedRef.current = true;
    setPopupImageLoading(true);
    enrichLocationFromWikidata(location.wikidataId)
      .then((enriched) => {
        if (!enriched.image) return;
        setPopupImage(enriched.image);
        setPopupImageAttribution(enriched.imageAttribution);
      })
      .catch(() => {})
      .finally(() => setPopupImageLoading(false));
  }, [location.id, location.image, location.wikidataId]);

  useEffect(() => {
    if (isHighlighted && markerRef.current) {
      triggerEnrichment();
      markerRef.current.openPopup();
    }
  }, [isHighlighted, triggerEnrichment]);

  const handleClick = () => {
    triggerEnrichment();
    if (onMarkerClick) {
      onMarkerClick(location.id);
    }
  };

  const position = useMemo<[number, number]>(
    () => [location.coordinates.lat, location.coordinates.lng],
    [location.coordinates.lat, location.coordinates.lng]
  );

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup maxWidth={300} minWidth={260} className="carbon-popup">
        <LocationPopup
          location={location}
          dayNumber={dayNumber}
          order={order}
          dayColor={dayColor}
          popupImage={popupImage}
          popupImageAttribution={popupImageAttribution}
          popupImageLoading={popupImageLoading}
        />
      </Popup>
    </Marker>
  );
}

export default LocationMarker;
