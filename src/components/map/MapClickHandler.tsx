import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number, event?: L.LeafletMouseEvent) => void;
}

/**
 * Component to handle map right-click events and show context menu
 */
function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    contextmenu: (e) => {
      // Right-click (context menu)
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      onMapClick(e.latlng.lat, e.latlng.lng, e);
    },
  });

  return null;
}

export default MapClickHandler;

