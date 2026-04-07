import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, TextInput } from '@carbon/react';
import { 
  ArrowLeft, 
  Search, 
  Edit, 
  Chat,
  Restaurant,
  Cafe,
  Hotel,
  Building,
  Store,
  Train,
  Tree,
  Time,
  Star,
  View,
} from '@carbon/icons-react';
import { useTripPlans } from '../../contexts/TripPlansContext';
import { searchLocations, GeocodingResult, SearchViewbox } from '../../services/geocoding';
import { searchByCategory, convertToGeocodingResult, POICategory } from '../../services/overpass';
import { enrichBatch, parseWikidataId, type EnrichedLocationData } from '../../services/wikimedia';
import SearchResults from '../search/SearchResults';

// Search history management
const SEARCH_HISTORY_KEY = 'tripplanner_search_history';
const MAX_HISTORY_ITEMS = 5;

function getSearchHistory(): string[] {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

function addToSearchHistory(query: string): void {
  if (!query || query.trim().length < 3) return;
  
  try {
    let history = getSearchHistory();
    // Remove if already exists
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    // Add to beginning
    history.unshift(query.trim());
    // Keep only max items
    history = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Quick filter categories with Overpass API support
const QUICK_FILTERS: {
  id: string;
  label: string;
  icon: any;
  query: string;
  overpassCategory?: POICategory;
}[] = [
  { id: 'attractions', label: 'Attractions', icon: Star, query: 'attraction', overpassCategory: 'attractions' },
  { id: 'historic', label: 'Historic', icon: Building, query: 'historic monument', overpassCategory: 'historic' },
  { id: 'restaurants', label: 'Food', icon: Restaurant, query: 'restaurant', overpassCategory: 'restaurants' },
  { id: 'cafes', label: 'Cafe', icon: Cafe, query: 'cafe', overpassCategory: 'cafes' },
  { id: 'viewpoints', label: 'Views', icon: View, query: 'viewpoint', overpassCategory: 'viewpoints' },
  { id: 'hotels', label: 'Hotel', icon: Hotel, query: 'hotel', overpassCategory: 'hotels' },
  { id: 'shop', label: 'Shop', icon: Store, query: 'shop' },
  { id: 'transport', label: 'Transport', icon: Train, query: 'station' },
  { id: 'park', label: 'Park', icon: Tree, query: 'park' },
];

interface HeaderProps {
  onLocationSelect?: (result: GeocodingResult, enriched?: EnrichedLocationData) => void;
  onAddLocationFromSearch?: (result: GeocodingResult, enriched?: EnrichedLocationData) => void;
  onPlanEdit?: () => void;
  onChatToggle?: () => void;
  isChatOpen?: boolean;
  mapBounds?: SearchViewbox;
}

function Header({ onLocationSelect, onAddLocationFromSearch, onPlanEdit, onChatToggle, isChatOpen, mapBounds }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlan } = useTripPlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [enrichedByPlaceId, setEnrichedByPlaceId] = useState<Record<number, EnrichedLocationData>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const enrichmentAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipEffectSearchRef = useRef(false);

  const isPlanEditor = location.pathname.includes('/plan/');

  // Run search immediately (no debounce) - used when user clicks Recent Search or Quick filter
  const runSearchNow = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 3) return;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setIsSearching(true);
    setShowResults(true);
    setShowDropdown(false);
    try {
      const results = await searchLocations(q, signal, mapBounds);
      if (!signal.aborted) {
        setSearchResults(results);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setSearchResults([]);
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [mapBounds]);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  const handleBack = () => {
    if (location.pathname.includes('/plan/')) {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
  };

  // Handle search with debounce and request cancellation
  useEffect(() => {
    // When user clicked Recent Search or Quick filter, we run search via runSearchNow – skip effect to avoid aborting that request
    if (skipEffectSearchRef.current) {
      skipEffectSearchRef.current = false;
      return;
    }
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Pass mapBounds to prioritize local results
        const results = await searchLocations(searchQuery, signal, mapBounds);
        // Only update if request wasn't cancelled
        if (!signal.aborted) {
          setSearchResults(results);
          setShowResults(true);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
          setSearchResults([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300); // Reduced debounce to 300ms for faster response

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery]);

  // Background enrichment when search results change (Wikidata/Wikipedia/Commons)
  useEffect(() => {
    if (searchResults.length === 0) {
      setEnrichedByPlaceId({});
      return;
    }
    const qIds = searchResults
      .map((r) => parseWikidataId(r.extratags?.wikidata))
      .filter((id): id is string => id !== null);
    const uniqueQIds = [...new Set(qIds)];
    if (uniqueQIds.length === 0) return;

    if (enrichmentAbortRef.current) enrichmentAbortRef.current.abort();
    enrichmentAbortRef.current = new AbortController();
    const signal = enrichmentAbortRef.current.signal;

    enrichBatch(uniqueQIds, undefined, signal).then((enrichedMap) => {
      if (signal.aborted) return;
      const byPlaceId: Record<number, EnrichedLocationData> = {};
      searchResults.forEach((r) => {
        const qId = parseWikidataId(r.extratags?.wikidata);
        if (qId) {
          const data = enrichedMap.get(qId);
          if (data) byPlaceId[r.place_id] = data;
        }
      });
      setEnrichedByPlaceId((prev) => ({ ...prev, ...byPlaceId }));
    });
    return () => {
      enrichmentAbortRef.current?.abort();
    };
  }, [searchResults]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      // Use click instead of mousedown to avoid interfering with input focus
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showResults]);


  const handleSearchSelect = (result: GeocodingResult) => {
    // Save to history
    const queryToSave = result.namedetails?.name || result.display_name.split(',')[0];
    addToSearchHistory(queryToSave);
    setSearchHistory(getSearchHistory());
    
    if (onLocationSelect) {
      const enriched = enrichedByPlaceId[result.place_id];
      onLocationSelect(result, enriched);
    }
    setSearchQuery('');
    setSearchResults([]);
    setEnrichedByPlaceId({});
    setShowResults(false);
    setShowDropdown(false);
    setActiveFilter(null);
  };

  // Handle quick filter click - use Overpass API when mapBounds available
  const handleFilterClick = useCallback(async (filter: typeof QUICK_FILTERS[0]) => {
    setActiveFilter(filter.id);
    setShowDropdown(false);
    
    // If we have mapBounds and the filter has an overpassCategory, use Overpass API
    if (mapBounds && filter.overpassCategory) {
      setIsSearching(true);
      setSearchResults([]);
      setShowResults(true);
      
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        const pois = await searchByCategory(
          filter.overpassCategory,
          mapBounds,
          abortControllerRef.current.signal
        );
        
        // Convert Overpass results to GeocodingResult format
        const results = pois.map(convertToGeocodingResult);
        setSearchResults(results);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Overpass search error:', error);
          // Fall back to text search
          setSearchQuery(filter.query);
        }
      } finally {
        setIsSearching(false);
      }
    } else {
      // Fall back to text search - run search immediately and show results panel
      const q = filter.query.trim();
      if (q.length >= 3) {
        skipEffectSearchRef.current = true;
        setSearchQuery(filter.query);
        setShowDropdown(false);
        setShowResults(true);
        setIsSearching(true);
        runSearchNow(q);
      } else {
        setSearchQuery(filter.query);
        setShowDropdown(false);
        setShowResults(true);
        setIsSearching(true);
      }
      inputRef.current?.focus();
    }
  }, [mapBounds, runSearchNow]);

  // Handle history item click - run search immediately and show results panel
  const handleHistoryClick = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 3) return;
    skipEffectSearchRef.current = true;
    setSearchQuery(q);
    setShowDropdown(false);
    setShowResults(true);
    setIsSearching(true);
    runSearchNow(q);
    inputRef.current?.focus();
  }, [runSearchNow]);

  // Clear history
  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setSearchHistory([]);
  }, []);

  // Handle input focus - show dropdown when input is empty and focused
  const handleInputFocus = () => {
    if (searchQuery.length < 3) {
      setShowDropdown(true);
    }
  };

  // Handle input blur (delayed to allow clicks on dropdown items)
  const handleInputBlur = () => {
    setTimeout(() => {
      if (!searchContainerRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
      }
    }, 200);
  };

  // Handle click on search container to show dropdown
  const handleSearchContainerClick = () => {
    if (searchQuery.length < 3 && !showResults && !isSearching) {
      setShowDropdown(true);
    }
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 1rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        {isPlanEditor && (
          <Button
            kind="ghost"
            hasIconOnly
            iconDescription="Back"
            onClick={handleBack}
            renderIcon={ArrowLeft}
            size="md"
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPlanEditor && currentPlan ? (
            <>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  {currentPlan.title}
                </h2>
                {currentPlan.days && currentPlan.days.length > 0 && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                    {currentPlan.days.length} days •{' '}
                    {currentPlan.days.reduce((sum, day) => sum + day.locations.length, 0)} points
                  </p>
                )}
              </div>
              {onPlanEdit && (
                <Button
                  kind="ghost"
                  hasIconOnly
                  iconDescription="Edit plan"
                  renderIcon={Edit}
                  size="sm"
                  onClick={onPlanEdit}
                  tooltipPosition="bottom"
                />
              )}
            </>
          ) : (
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Trip Planner</h2>
          )}
        </div>
      </div>

      {/* Center section - Search */}
      {isPlanEditor && (
        <div
          ref={searchContainerRef}
          onClick={handleSearchContainerClick}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            maxWidth: '640px',
            minWidth: '320px',
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <TextInput
              id="search"
              ref={inputRef as any}
              placeholder="Search location..."
              labelText=""
              hideLabel
              size="md"
              value={searchQuery}
              onChange={(e: any) => {
                setSearchQuery(e.target.value);
                setShowDropdown(false);
                if (e.target.value.length < 3) {
                  setActiveFilter(null);
                }
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              style={{ width: '100%', paddingRight: isSearching ? '1rem' : '2.5rem' }}
              autoComplete="off"
            />
            {!isSearching && (
              <div
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search size={16} />
              </div>
            )}

            {/* Search Results */}
            {(showResults || isSearching) && !showDropdown && (
              <SearchResults
                results={searchResults}
                enrichedByPlaceId={enrichedByPlaceId}
                onSelect={handleSearchSelect}
                onAddToPlan={onAddLocationFromSearch}
                onClose={() => setShowResults(false)}
                isLoading={isSearching}
                canAddToPlan={!!onAddLocationFromSearch}
              />
            )}

            {/* Quick Filters & History Dropdown */}
            {showDropdown && !showResults && !isSearching && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderTop: 'none',
                  zIndex: 1000,
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Quick Filters */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '11px', color: '#6f6f6f', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Quick filters
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {QUICK_FILTERS.map((filter) => {
                      const IconComponent = filter.icon;
                      const isActive = activeFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          onClick={() => handleFilterClick(filter)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            fontSize: '12px',
                            backgroundColor: isActive ? '#0f62fe' : '#f4f4f4',
                            color: isActive ? '#ffffff' : '#161616',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = '#e0e0e0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = '#f4f4f4';
                            }
                          }}
                        >
                          <IconComponent size={14} />
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem' 
                    }}>
                      <div style={{ fontSize: '11px', color: '#6f6f6f', fontWeight: 500 }}>
                        Recent searches
                      </div>
                      <button
                        onClick={handleClearHistory}
                        style={{
                          fontSize: '11px',
                          color: '#6f6f6f',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.125rem 0.25rem',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f62fe'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#6f6f6f'}
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {searchHistory.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleHistoryClick(query)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.5rem',
                            fontSize: '13px',
                            color: '#161616',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.1s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f4f4'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Time size={14} style={{ color: '#6f6f6f' }} />
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyboard hint */}
                <div
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f4f4f4',
                    borderTop: '1px solid #e0e0e0',
                    fontSize: '11px',
                    color: '#6f6f6f',
                  }}
                >
                  Type at least 3 characters to search
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isPlanEditor && onChatToggle && (
          <Button
            kind="primary"
            hasIconOnly
            iconDescription={isChatOpen ? "Hide AI chat" : "Show AI chat"}
            renderIcon={Chat}
            size="md"
            onClick={onChatToggle}
          />
        )}
      </div>
    </header>
  );
}

export default Header;


