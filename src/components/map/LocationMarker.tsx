import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef, useMemo, useState } from 'react';
import { Location } from '../../types';
import { getCategoryIconPath } from '../../utils/categoryIconPaths';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { getDayColor } from '../../utils/dayColors';
import { enrichLocationFromWikidata } from '../../services/wikimedia';
import { Star, Time, Video } from '@carbon/icons-react';
import CoverWithPlaceholder from '../ui/CoverWithPlaceholder';
import ImageWithPlaceholder from '../ui/ImageWithPlaceholder';

const MAX_AUTHOR_LEN = 45;
const MAX_LICENSE_LEN = 25;

/** Short label for image source (a few words) for display in attribution. */
function getSourceLabel(sourceUrl: string): string {
  try {
    const u = new URL(sourceUrl);
    const host = u.hostname.replace(/^www\./, '');
    if (host.includes('commons.wikimedia.org')) return 'Wikimedia Commons';
    if (host.includes('wikimedia.org')) return 'Wikimedia';
    if (host.includes('wikipedia.org')) return 'Wikipedia';
    return host;
  } catch {
    return 'Source';
  }
}

/** Short author line: extract name after " by " or truncate. */
function shortAuthor(author: string): string {
  const by = author.indexOf(' by ');
  if (by !== -1) {
    const after = author.slice(by + 4).trim();
    const end = after.search(/[.\n]/);
    const name = end === -1 ? after : after.slice(0, end).trim();
    return name.length <= MAX_AUTHOR_LEN ? name : name.slice(0, MAX_AUTHOR_LEN - 1) + '…';
  }
  return author.length <= MAX_AUTHOR_LEN ? author : author.slice(0, MAX_AUTHOR_LEN - 1) + '…';
}

/** Short license: prefer CC short name (e.g. "CC BY-SA 3.0") or truncate. */
function shortLicense(license: string): string {
  const cc = license.match(/(CC\s+(?:BY[-\s]*(?:SA|NC|ND)?\s*(?:\d+\.\d+)?(?:\s*\+\s*[A-Z]+)?))/i);
  if (cc) return cc[1].replace(/\s+/g, ' ').trim();
  return license.length <= MAX_LICENSE_LEN ? license : license.slice(0, MAX_LICENSE_LEN - 1) + '…';
}

interface LocationMarkerProps {
  location: Location;
  order: number;
  dayNumber: number;
  onMarkerClick?: (locationId: string) => void;
  isHighlighted?: boolean;
}

/**
 * Custom marker icon based on day number (same color for all locations in a day)
 */
function getMarkerIcon(category: Location['category'], dayNumber: number, order: number, isHighlighted: boolean) {
  // Use day color instead of category color
  const color = getDayColor(dayNumber);
  const borderColor = isHighlighted ? '#ffffff' : color;
  const borderWidth = isHighlighted ? 3 : 2;
  const iconPath = getCategoryIconPath(category);

  // Create custom HTML for marker with icon and order number badge
  const html = `
    <div style="
      background-color: ${color};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: ${isHighlighted ? '0 0 0 4px rgba(15, 98, 254, 0.3)' : '0 2px 4px rgba(0,0,0,0.3)'};
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    ">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
        <path d="${iconPath}"/>
      </svg>
      <div style="
        position: absolute;
        top: -4px;
        right: -4px;
        background-color: #ffffff;
        border: 2px solid ${color};
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      ">
        <span style="
          font-size: 11px;
          font-weight: 700;
          color: ${color};
          line-height: 1;
        ">${order}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

function LocationMarker({ location, order, dayNumber, onMarkerClick, isHighlighted = false }: LocationMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const [popupImage, setPopupImage] = useState<string | undefined>(undefined);
  const [popupImageAttribution, setPopupImageAttribution] = useState<Location['imageAttribution']>(undefined);

  // Lazy-load Wikipedia/Commons image when location has wikidataId but no image (e.g. older data)
  useEffect(() => {
    if (location.image || !location.wikidataId) {
      setPopupImage(undefined);
      setPopupImageAttribution(undefined);
      return;
    }
    let cancelled = false;
    enrichLocationFromWikidata(location.wikidataId)
      .then((enriched) => {
        if (cancelled || !enriched.image) return;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bb239023-cde3-46c7-be09-5a71c6644f5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aa31bd'},body:JSON.stringify({sessionId:'aa31bd',location:'LocationMarker.tsx:setPopupImage',message:'LocationMarker enrichment setState',data:{locationId:location.id},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        setPopupImage(enriched.image);
        setPopupImageAttribution(enriched.imageAttribution);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [location.id, location.image, location.wikidataId]);

  // Memoize icon to prevent infinite re-renders
  const icon = useMemo(
    () => getMarkerIcon(location.category, dayNumber, order, isHighlighted),
    [location.category, dayNumber, order, isHighlighted]
  );
  
  const dayColor = useMemo(() => getDayColor(dayNumber), [dayNumber]);

  // Open popup when location is selected from sidebar
  useEffect(() => {
    if (isHighlighted && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isHighlighted]);

  const handleClick = () => {
    if (onMarkerClick) {
      onMarkerClick(location.id);
    }
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    try {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    } catch {
      return null;
    }
  };

  const youtubeVideos = location.media?.filter(m => m.type === 'youtube') || [];
  const firstVideo = youtubeVideos[0];
  const videoThumbnail = firstVideo ? getYouTubeThumbnail(firstVideo.url) : null;

  // Memoize position to prevent unnecessary re-renders
  const position = useMemo<[number, number]>(
    () => [location.coordinates.lat, location.coordinates.lng],
    [location.coordinates.lat, location.coordinates.lng]
  );

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup 
        maxWidth={300} 
        minWidth={260}
        className="carbon-popup"
      >
        <div style={{ 
          fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
        }}>
          {/* Main image from Wikipedia/Commons – stored on location or lazy-loaded via wikidataId */}
          {(location.image ?? popupImage) && (
            <div style={{ marginBottom: '0.5rem', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '110px' }}>
                <CoverWithPlaceholder
                  coverUrl={location.image ?? popupImage ?? null}
                  fallbackStyle={{ backgroundColor: 'var(--cds-layer-02, #e8e8e8)' }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              {(location.imageAttribution || popupImageAttribution) && (
                <div
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '10px',
                    lineHeight: 1.3,
                    color: 'var(--cds-text-secondary, #6f6f6f)',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                  }}
                >
                  {(location.imageAttribution || popupImageAttribution)?.author && (
                    <span>© {shortAuthor((location.imageAttribution || popupImageAttribution)!.author!)}</span>
                  )}
                  {(location.imageAttribution || popupImageAttribution)?.license && (
                    <span>{(location.imageAttribution || popupImageAttribution)?.author ? ' · ' : ''}{shortLicense((location.imageAttribution || popupImageAttribution)!.license!)}</span>
                  )}
                  {(location.imageAttribution || popupImageAttribution)?.sourceUrl && (
                    <a
                      href={(location.imageAttribution || popupImageAttribution)!.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--cds-link-primary, #0f62fe)', marginLeft: '0.25rem' }}
                    >
                      {getSourceLabel((location.imageAttribution || popupImageAttribution)!.sourceUrl!)}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Header with icon, name, and rating - matching sidebar style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {(() => {
              try {
                const IconComponent = getCategoryIcon(location.category);
                return <IconComponent size={16} style={{ color: 'var(--cds-text-secondary)', flexShrink: 0 }} />;
              } catch (err) {
                return null;
              }
            })()}
            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 600, flex: 1, color: 'var(--cds-text-primary)' }}>
              {location.name}
            </h5>
            {location.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '12px', color: 'var(--cds-text-secondary)' }}>
                <Star size={12} />
                <span>{location.rating.toFixed(1)}/5</span>
              </div>
            )}
          </div>
          
          {/* Category */}
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '12px', color: 'var(--cds-text-secondary)', textTransform: 'capitalize' }}>
            {location.category}
          </p>
          
          {/* Opening hours - matching sidebar style */}
          {location.openingHours && (
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '12px', color: 'var(--cds-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Time size={12} />
              <span>{location.openingHours}</span>
            </p>
          )}

          {/* Description (start of text) + Wikipedia link */}
          {(location.description || location.wikipediaUrl) && (
            <div style={{ marginBottom: '0.5rem' }}>
              {location.description && (
                <p style={{ 
                  margin: '0 0 0.25rem 0', 
                  fontSize: '12px', 
                  lineHeight: 1.4, 
                  color: 'var(--cds-text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {location.description.length > 200
                    ? `${location.description.slice(0, 200).trim()}…`
                    : location.description}
                </p>
              )}
              {location.wikipediaUrl && (
                <a
                  href={location.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: '12px', color: 'var(--cds-link-primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Wikipedia →
                </a>
              )}
            </div>
          )}

          {/* YouTube thumbnail */}
          {firstVideo && videoThumbnail && (
            <a 
              href={firstVideo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'block',
                position: 'relative',
                marginBottom: '0.5rem',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithPlaceholder
                src={videoThumbnail}
                alt="Video thumbnail"
                loading="lazy"
                objectFit="cover"
                style={{ width: '100%', height: '120px' }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Video size={20} style={{ color: '#ffffff' }} />
              </div>
              {youtubeVideos.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: '#ffffff',
                  fontWeight: 600
                }}>
                  +{youtubeVideos.length - 1} more
                </div>
              )}
            </a>
          )}

          {/* Footer - Day info */}
          <div style={{ 
            paddingTop: '0.5rem', 
            borderTop: '1px solid var(--cds-border-subtle)',
            fontSize: '12px', 
            color: 'var(--cds-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: dayColor,
                flexShrink: 0
              }}
            />
            <span>Day {dayNumber} • Order {order}</span>
          </div>

        </div>
      </Popup>
    </Marker>
  );
}

export default LocationMarker;

