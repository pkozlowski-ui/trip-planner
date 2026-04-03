/**
 * Read-only place tiles for AI chat. Renders a list of places (e.g. search results, recommendations)
 * in a compact horizontal card layout. Clicking a tile shows the place on the map (via ChatMapContext).
 * Shows place image when provided by the agent, or fetches it from Wikidata when missing.
 */
import { useState, useEffect } from 'react';
import { Star } from '@carbon/icons-react';
import { Tile } from '@carbon/react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { useChatMap } from '../../contexts/ChatMapContext';
import { reverseGeocode } from '../../services/geocoding';
import { enrichLocationFromWikidata, parseWikidataId } from '../../services/wikimedia';
import type { LocationCategory } from '../../types';
import styles from './ChatPlaceTiles.module.scss';

const imageCache = new Map<string, string>();

async function fetchImageForCoords(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = imageCache.get(key);
  if (cached) return cached;
  try {
    const geo = await reverseGeocode(lat, lng);
    const qId = geo?.extratags?.wikidata ? parseWikidataId(geo.extratags.wikidata) : null;
    if (!qId) return null;
    const enriched = await enrichLocationFromWikidata(qId);
    if (enriched?.image) {
      imageCache.set(key, enriched.image);
      return enriched.image;
    }
  } catch {
    // ignore
  }
  return null;
}

export interface ChatPlaceSummary {
  name: string;
  display_name?: string;
  type?: string;
  category?: string;
  image?: string;
  rating?: number;
  lat: number;
  lng?: number;
  lon?: number; // agent/tool often sends lon
}

function osmTypeToCategory(type?: string, category?: string): LocationCategory {
  const t = (type ?? '').toLowerCase();
  const c = (category ?? '').toLowerCase();
  if (t === 'museum' || c === 'museum') return 'museum';
  if (t === 'restaurant' || c === 'restaurant' || t === 'cafe' || t === 'fast_food') return 'restaurant';
  if (t === 'hotel' || c === 'hotel' || t === 'hostel') return 'hotel';
  if (t === 'park' || c === 'park' || t === 'garden') return 'park';
  if (t === 'attraction' || t === 'monument' || t === 'artwork' || c === 'tourism') return 'attraction';
  if (t === 'viewpoint') return 'viewpoint';
  if (t === 'beach') return 'beach';
  if (t === 'mountain' || c === 'natural') return 'mountain';
  if (t === 'city' || t === 'town' || t === 'village') return 'city';
  return 'other';
}

function ChatPlaceTile({ place }: { place: ChatPlaceSummary }) {
  const hasInitialImage = !!(place.image?.trim());
  const [thumbVisible, setThumbVisible] = useState(hasInitialImage);
  const [fetchedImage, setFetchedImage] = useState<string | null>(null);
  const chatMap = useChatMap();
  const category = osmTypeToCategory(place.type, place.category);
  const IconComponent = getCategoryIcon(category);
  const subtitle = place.display_name && place.display_name !== place.name
    ? place.display_name
    : (place.type || place.category || '');
  const lng = place.lng ?? place.lon;

  const imageUrl = place.image?.trim() || fetchedImage || null;

  useEffect(() => {
    if (imageUrl || typeof lng !== 'number') return;
    let cancelled = false;
    fetchImageForCoords(place.lat, lng).then((url) => {
      if (!cancelled && url) setFetchedImage(url);
    });
    return () => { cancelled = true; };
  }, [place.lat, lng, imageUrl]);

  const handleClick = () => {
    if (chatMap && typeof lng === 'number') {
      chatMap.showLocationOnMap(place.lat, lng, place.name);
    }
  };

  return (
    <Tile
      className={styles.tile}
      onClick={typeof lng === 'number' && chatMap ? handleClick : undefined}
      role={typeof lng === 'number' && chatMap ? 'button' : undefined}
      tabIndex={typeof lng === 'number' && chatMap ? 0 : undefined}
      onKeyDown={
        typeof lng === 'number' && chatMap
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      aria-label={typeof lng === 'number' && chatMap ? `Show ${place.name} on map` : undefined}
    >
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <IconComponent size={16} className={styles.icon} aria-hidden />
          <h5 className={styles.title}>{place.name}</h5>
          {place.rating != null && (
            <span className={styles.rating} title="Ocena">
              <Star size={12} aria-hidden />
              {Number(place.rating).toFixed(1)}/5
            </span>
          )}
          {subtitle ? <span className={styles.meta}>{subtitle}</span> : null}
          {imageUrl && thumbVisible ? (
            <div className={styles.thumb}>
              <img
                src={imageUrl}
                alt=""
                className={styles.thumbImg}
                onError={() => setThumbVisible(false)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Tile>
  );
}

export interface ChatPlaceTilesProps {
  places: ChatPlaceSummary[];
}

function ChatPlaceTiles({ places }: ChatPlaceTilesProps) {
  const valid = Array.isArray(places)
    ? places.filter((p) => {
        if (p == null || typeof p.name !== 'string' || typeof p.lat !== 'number') return false;
        const lng = p.lng ?? p.lon;
        return typeof lng === 'number';
      })
    : [];

  if (valid.length === 0) return null;

  return (
    <div className={styles.wrap} role="list">
      {valid.map((place, i) => (
        <div key={i} role="listitem" className={styles.item}>
          <ChatPlaceTile place={place} />
        </div>
      ))}
    </div>
  );
}

export default ChatPlaceTiles;
