/**
 * Small inline map for AI chat responses. Renders a static mini map with optional markers.
 * Used as a Tambo generative component so the agent can embed map previews (e.g. after search_places or for a day's locations).
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_CONFIG = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

export interface ChatMiniMapProps {
  /** Center of the map */
  center: { lat: number; lng: number };
  /** Zoom level (default 13) */
  zoom?: number;
  /** Optional markers to show */
  markers?: Array<{ lat: number; lng: number; label?: string }>;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const defaultIcon = L.divIcon({
  className: 'chat-minimap-marker',
  html: '<div style="width:12px;height:12px;background:#0f62fe;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function ChatMiniMap({ center, zoom = 13, markers = [] }: ChatMiniMapProps) {
  const lat = center && typeof center.lat === 'number' ? center.lat : 50.08;
  const lng = center && typeof center.lng === 'number' ? center.lng : 14.43;
  const centerTuple: [number, number] = [lat, lng];
  const safeZoom = typeof zoom === 'number' && zoom >= 1 && zoom <= 18 ? zoom : 13;
  const validMarkers = Array.isArray(markers)
    ? markers.filter((m) => {
        if (m == null || typeof m.lat !== 'number') return false;
        const lng = (m as { lng?: number }).lng ?? (m as { lon?: number }).lon;
        return typeof lng === 'number';
      })
    : [];

  return (
    <div className="chat-minimap-wrap" style={{ width: '100%', maxWidth: 280, height: 160, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--cds-border-subtle, #e0e0e0)' }}>
      <MapContainer
        center={centerTuple}
        zoom={safeZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <ChangeView center={centerTuple} zoom={safeZoom} />
        <TileLayer url={TILE_CONFIG.url} attribution={TILE_CONFIG.attribution} subdomains="abcd" maxZoom={19} />
        {validMarkers.map((m, i) => (
          <Marker key={i} position={[m.lat, (m as { lng?: number }).lng ?? (m as { lon?: number }).lon!]} icon={defaultIcon}>
            {m.label ? <Popup>{m.label}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ChatMiniMap;
