import { useState, useEffect } from 'react';
import { Button, Loading } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { GeocodingResult } from '../../services/geocoding';
import type { EnrichedLocationData } from '../../services/wikimedia';

interface ContextMenuProps {
  x: number;
  y: number;
  locationInfo?: GeocodingResult | null;
  enriched?: EnrichedLocationData | null;
  isLoadingLocationInfo?: boolean;
  onAddMarker: () => void;
  onClose: () => void;
}

function ContextMenu({ 
  x, 
  y, 
  locationInfo, 
  enriched,
  isLoadingLocationInfo = false,
  onAddMarker, 
  onClose 
}: ContextMenuProps) {
  const hasWikidata = !!locationInfo?.extratags?.wikidata;
  const isLoadingEnrichment = hasWikidata && !enriched && !isLoadingLocationInfo;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const url = enriched?.image;
    if (!url?.trim()) {
      setImageLoaded(false);
      return;
    }
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = url;
    return () => {
      img.src = '';
    };
  }, [enriched?.image]);
  // Format location info for display
  const getLocationDisplayText = () => {
    if (isLoadingLocationInfo) {
      return 'Loading location info...';
    }

    if (!locationInfo) {
      return 'Unknown location';
    }

    // Try to get a meaningful name from the address
    const address = locationInfo.address || {};
    const displayName = locationInfo.display_name || '';
    
    // Extract building name or street name
    let locationText = '';
    
    // Priority: building name > street name > first part of display_name
    if (address.building) {
      locationText = address.building;
    } else if (address.road) {
      locationText = address.road;
      if (address.house_number) {
        locationText = `${address.house_number} ${locationText}`;
      }
    } else if (address.address29) {
      // Sometimes building name is in address29
      locationText = address.address29;
    } else {
      // Fallback to first part of display_name
      const parts = displayName.split(',');
      locationText = parts[0] || 'Location';
    }

    // Add type/category if available
    if (locationInfo.type || locationInfo.category) {
      const type = locationInfo.type || locationInfo.category || '';
      if (type && type !== 'yes') {
        locationText += ` (${type})`;
      }
    }

    return locationText;
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        minWidth: '200px',
        maxWidth: '300px',
        padding: '0.5rem',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Location info section */}
      <div
        style={{
          padding: '0.5rem',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          {(enriched?.image || isLoadingEnrichment) && (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                backgroundColor: enriched?.image && imageLoaded ? 'transparent' : '#f4f4f4',
                backgroundImage: enriched?.image ? `url(${enriched.image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: enriched?.image && imageLoaded ? 1 : 0,
                transition: 'opacity 0.2s cubic-bezier(0.2, 0, 0.38, 0.9)',
              }}
              className={enriched?.image && imageLoaded ? 'cover-image-loaded' : undefined}
            >
              {isLoadingEnrichment && <Loading withOverlay={false} small description="" />}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12px',
                color: '#525252',
                fontWeight: 500,
                marginBottom: '0.25rem',
              }}
            >
              Location:
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#161616',
                lineHeight: '1.4',
                wordWrap: 'break-word',
              }}
            >
              {getLocationDisplayText()}
            </div>
            {locationInfo?.display_name && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#525252',
                  marginTop: '0.25rem',
                  lineHeight: '1.3',
                  wordWrap: 'break-word',
                }}
              >
                {locationInfo.display_name.length > 80
                  ? `${locationInfo.display_name.substring(0, 80)}...`
                  : locationInfo.display_name}
              </div>
            )}
            {enriched?.description && (
              <div
                style={{
                  marginTop: '0.375rem',
                  fontSize: '11px',
                  color: '#6f6f6f',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {enriched.description}
              </div>
            )}
            {(enriched?.wikipediaUrl || enriched?.website) && (
              <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {enriched.wikipediaUrl && (
                  <a
                    href={enriched.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '11px', color: '#0f62fe', textDecoration: 'none' }}
                  >
                    Wikipedia
                  </a>
                )}
                {enriched.website && (
                  <a
                    href={enriched.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '11px', color: '#0f62fe', textDecoration: 'none' }}
                  >
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Marker button */}
      <Button
        kind="ghost"
        size="sm"
        renderIcon={Add}
        onClick={() => {
          onAddMarker();
          onClose();
        }}
        style={{ width: '100%', justifyContent: 'flex-start' }}
      >
        Add Marker
      </Button>
    </div>
  );
}

export default ContextMenu;

