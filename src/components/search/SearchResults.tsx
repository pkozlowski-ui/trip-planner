import { useState, useEffect, useRef, useCallback } from 'react';
import { Loading, Button } from '@carbon/react';
import {
  Location,
  Restaurant,
  Cafe,
  Hotel,
  Building,
  Store,
  Tree,
  Train,
  Bus,
  Plane,
  Star,
  View,
  Time,
  Link as LinkIcon,
  Phone,
  Events,
} from '@carbon/icons-react';
import { GeocodingResult } from '../../services/geocoding';
import { formatCuisine, formatHistoricType } from '../../services/overpass';
import type { EnrichedLocationData } from '../../services/wikimedia';

// Get display-friendly category name
function getCategoryDisplayName(category?: string, type?: string): string {
  const categoryMap: Record<string, string> = {
    'museum': 'Museum',
    'attraction': 'Attraction',
    'viewpoint': 'Viewpoint',
    'restaurant': 'Restaurant',
    'cafe': 'Café',
    'bar': 'Bar',
    'pub': 'Pub',
    'fast_food': 'Fast Food',
    'hotel': 'Hotel',
    'hostel': 'Hostel',
    'guest_house': 'Guest House',
    'bus_station': 'Bus Station',
    'train_station': 'Train Station',
    'airport': 'Airport',
    'marketplace': 'Market',
    'supermarket': 'Supermarket',
    'mall': 'Shopping Mall',
    'park': 'Park',
    'garden': 'Garden',
    'beach': 'Beach',
    'cinema': 'Cinema',
    'theatre': 'Theatre',
    'library': 'Library',
    'university': 'University',
    'hospital': 'Hospital',
    'pharmacy': 'Pharmacy',
    'church': 'Church',
    'cathedral': 'Cathedral',
    'administrative': 'Area',
    'city': 'City',
    'town': 'Town',
    'village': 'Village',
    'suburb': 'Suburb',
    'neighbourhood': 'Neighbourhood',
    'residential': 'Residential',
    'house': 'Address',
    'building': 'Building',
    'yes': 'Place',
  };
  
  return categoryMap[type || ''] || categoryMap[category || ''] || type || category || 'Place';
}

interface SearchResultsProps {
  results: GeocodingResult[];
  enrichedByPlaceId?: Record<number, EnrichedLocationData>;
  onSelect: (result: GeocodingResult) => void;
  onAddToPlan?: (result: GeocodingResult, enriched?: EnrichedLocationData) => void;
  canAddToPlan?: boolean;
  onClose?: () => void;
  isLoading?: boolean;
  onHover?: (result: GeocodingResult | null) => void;
}

// Map OSM type/category to Carbon icon
function getIconForResult(result: GeocodingResult) {
  const type = result.type?.toLowerCase() || '';
  const category = result.category?.toLowerCase() || '';
  const historic = result.extratags?.historic?.toLowerCase() || '';
  
  // Historic sites (from Overpass)
  if (category === 'historic' || historic) {
    return Events;
  }
  
  // Tourism
  if (type === 'museum' || category === 'tourism') return Building;
  if (type === 'attraction' || type === 'monument' || type === 'artwork') return Star;
  if (type === 'viewpoint') return View;
  
  // Food & Drink
  if (type === 'restaurant' || category === 'restaurant') return Restaurant;
  if (type === 'cafe' || type === 'coffee') return Cafe;
  if (type === 'bar' || type === 'pub') return Restaurant;
  if (type === 'fast_food') return Restaurant;
  
  // Accommodation
  if (type === 'hotel' || type === 'hostel' || type === 'guest_house' || type === 'motel') return Hotel;
  
  // Transport
  if (type === 'train_station' || type === 'railway') return Train;
  if (type === 'bus_station' || type === 'bus_stop') return Bus;
  if (type === 'airport' || type === 'aerodrome') return Plane;
  
  // Shopping
  if (category === 'shop' || type === 'mall' || type === 'marketplace') return Store;
  
  // Nature
  if (type === 'park' || type === 'garden' || type === 'forest') return Tree;
  
  // Default
  return Location;
}

// Format opening hours for display
function formatOpeningHours(hours?: string): string | null {
  if (!hours) return null;
  
  // Simple formatting - just show first part if too long
  const simplified = hours.split(';')[0].trim();
  if (simplified.length > 30) {
    return simplified.substring(0, 27) + '...';
  }
  return simplified;
}

// Get short address from result
function getShortAddress(result: GeocodingResult): string {
  const parts: string[] = [];
  
  if (result.address?.road) {
    parts.push(result.address.road);
    if (result.address?.house_number) {
      parts[0] = `${result.address.house_number} ${parts[0]}`;
    }
  }
  
  const city = result.address?.city || result.address?.town || result.address?.village;
  if (city) parts.push(city);
  
  if (result.address?.country) parts.push(result.address.country);
  
  if (parts.length === 0) {
    // Fallback to display_name parts
    return result.display_name.split(',').slice(1, 3).join(',').trim();
  }
  
  return parts.join(', ');
}

function SearchResults({ 
  results, 
  enrichedByPlaceId = {},
  onSelect, 
  onAddToPlan,
  canAddToPlan = false,
  isLoading = false,
  onHover 
}: SearchResultsProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset focus when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          onSelect(results[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(-1);
        break;
    }
  }, [results, focusedIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [focusedIndex]);

  if (isLoading) {
    return (
      <div
        className="search-results"
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <Loading description="Searching..." withOverlay={false} small />
        <span style={{ fontSize: '14px', color: 'var(--cds-text-secondary)' }}>Searching...</span>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      role="list"
      aria-label="Search results"
      className="search-results"
    >
      {results.map((result, index) => {
        const IconComponent = getIconForResult(result);
        const categoryName = getCategoryDisplayName(result.category, result.type);
        const openingHours = formatOpeningHours(result.extratags?.opening_hours);
        const website = result.extratags?.website;
        const phone = result.extratags?.phone;
        const cuisine = formatCuisine(result.extratags?.cuisine);
        const historicType = formatHistoricType(result.extratags?.historic);
        const isFocused = index === focusedIndex;
        const enriched = enrichedByPlaceId[result.place_id];

        return (
          <div
            key={result.place_id}
            ref={el => itemRefs.current[index] = el}
            role="listitem"
            aria-current={isFocused ? 'true' : undefined}
            className={`search-results__row ${isFocused ? 'search-results__row--focused' : ''}`}
            onMouseEnter={() => {
              setFocusedIndex(index);
              onHover?.(result);
            }}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onSelect(result)}
          >
            <div className="search-results__icon-wrap">
              <IconComponent size={20} style={{ color: 'var(--cds-text-secondary)' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="search-results__name">
                {result.namedetails?.name || result.display_name.split(',')[0]}
              </div>

              <div
                className="search-results__address"
                style={{ marginBottom: enriched?.description ? '0.25rem' : '0.375rem' }}
              >
                {getShortAddress(result)}
              </div>

              {enriched?.description && (
                <div className="search-results__description" style={{ marginBottom: '0.375rem' }}>
                  {enriched.description}
                </div>
              )}

              <div className="search-results__meta">
                <span
                  style={{
                    backgroundColor: 'var(--cds-layer-hover)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '2px',
                    fontWeight: 500,
                    color: '#161616',
                  }}
                >
                  {categoryName}
                </span>

                {cuisine && (
                  <span
                    style={{
                      backgroundColor: 'var(--cds-layer-accent)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '2px',
                      fontWeight: 500,
                      color: '#161616',
                    }}
                  >
                    {cuisine}
                  </span>
                )}

                {historicType && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: 'var(--cds-layer-accent)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '2px',
                      fontWeight: 500,
                      color: '#161616',
                    }}
                  >
                    <Events size={12} />
                    {historicType}
                  </span>
                )}

                {/* Opening hours */}
                {openingHours && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Time size={12} />
                    {openingHours}
                  </span>
                )}

                {/* Website indicator (no Wiki link in search – shown on map marker) */}
                {website && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <LinkIcon size={12} />
                    Website
                  </span>
                )}

                {/* Phone indicator */}
                {phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={12} />
                    {phone.length > 15 ? phone.substring(0, 12) + '...' : phone}
                  </span>
                )}
              </div>

              {/* Add to plan (only in plan editor when handler provided) */}
              {canAddToPlan && onAddToPlan && (
                <div style={{ marginTop: '0.375rem' }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    kind="secondary"
                    size="sm"
                    onClick={() => onAddToPlan(result, enriched)}
                    style={{ minWidth: 0 }}
                  >
                    Add to plan
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="search-results__footer">
        <span>↑↓ Navigate</span>
        <span>Enter Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
}

export default SearchResults;
