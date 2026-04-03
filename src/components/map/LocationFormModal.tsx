import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  TextInput,
  TextArea,
  Stack,
  Loading,
} from '@carbon/react';
import { Star, Time } from '@carbon/icons-react';
import { LocationCategory, MediaItem, ImageAttribution } from '../../types';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { enrichLocationFromWikidata, parseWikidataId } from '../../services/wikimedia';
import type { GeocodingResult } from '../../services/geocoding';

interface LocationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => Promise<void>;
  initialData?: Partial<LocationFormData>;
  geocodingResult?: GeocodingResult | null;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  locationId?: string;
  planId?: string;
}

export interface LocationFormData {
  name: string;
  category: LocationCategory;
  dayId: string;
  description?: string;
  image?: string;
  imageAttribution?: ImageAttribution;
  website?: string;
  wikipediaUrl?: string;
  wikidataId?: string;
  media?: MediaItem[];
  rating?: number;
  openingHours?: string;
}

const LOCATION_CATEGORIES: { value: LocationCategory; label: string }[] = [
  { value: 'city', label: 'City' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'park', label: 'Park' },
  { value: 'museum', label: 'Museum' },
  { value: 'beach', label: 'Beach' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'viewpoint', label: 'Viewpoint' },
  { value: 'other', label: 'Other' },
];

function LocationFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  geocodingResult,
  isSubmitting = false,
  isEditMode = false,
}: LocationFormModalProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || '',
    category: initialData?.category || 'other',
    dayId: initialData?.dayId || '',
    description: initialData?.description || '',
    image: initialData?.image,
    imageAttribution: initialData?.imageAttribution,
    website: initialData?.website,
    wikipediaUrl: initialData?.wikipediaUrl,
    wikidataId: initialData?.wikidataId,
    media: initialData?.media || [],
    rating: initialData?.rating,
    openingHours: initialData?.openingHours,
  });

  const [isEnriching, setIsEnriching] = useState(false);
  const enrichmentAbortRef = useRef<AbortController | null>(null);

  // Background enrichment when modal opens with geocodingResult that has wikidata
  useEffect(() => {
    if (!open || !geocodingResult?.extratags?.wikidata) return;
    const qId = parseWikidataId(geocodingResult.extratags.wikidata);
    if (!qId) return;

    if (enrichmentAbortRef.current) enrichmentAbortRef.current.abort();
    enrichmentAbortRef.current = new AbortController();
    const signal = enrichmentAbortRef.current.signal;
    setIsEnriching(true);

    enrichLocationFromWikidata(qId, undefined, signal)
      .then((enriched) => {
        if (signal.aborted) return;
        setFormData((prev) => ({
          ...prev,
          ...(enriched.description && { description: enriched.description }),
          ...(enriched.image && { image: enriched.image }),
          ...(enriched.imageAttribution && { imageAttribution: enriched.imageAttribution }),
          ...(enriched.website && { website: enriched.website }),
          ...(enriched.wikipediaUrl && { wikipediaUrl: enriched.wikipediaUrl }),
          wikidataId: qId,
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (!signal.aborted) setIsEnriching(false);
      });
    return () => {
      enrichmentAbortRef.current?.abort();
    };
  }, [open, geocodingResult?.extratags?.wikidata]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'other',
        dayId: initialData.dayId || '',
        description: initialData.description || '',
        image: initialData.image,
        imageAttribution: initialData.imageAttribution,
        website: initialData.website,
        wikipediaUrl: initialData.wikipediaUrl,
        wikidataId: initialData.wikidataId,
        media: initialData.media || [],
        rating: initialData.rating,
        openingHours: initialData.openingHours,
      });
    }
  }, [initialData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: initialData?.name || '',
        category: initialData?.category || 'other',
        dayId: initialData?.dayId || '',
        description: initialData?.description || '',
        image: initialData?.image,
        imageAttribution: initialData?.imageAttribution,
        website: initialData?.website,
        wikidataId: initialData?.wikidataId,
        media: initialData?.media || [],
        rating: initialData?.rating,
        openingHours: initialData?.openingHours,
      });
    }
  }, [open, initialData]);

  const handleChange = (field: keyof LocationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    await onSubmit(formData);
  };


  return (
    <Modal
      open={open}
      modalHeading={isEditMode ? 'Edit Location' : 'Add Location'}
      primaryButtonText={isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Location' : 'Add Location')}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting || !formData.name.trim()}
      size="lg"
    >
      <div>
        <Stack gap={6}>
            {/* Location Name */}
            <TextInput
              id="location-name"
              labelText="Location Name *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter location name"
              required
              disabled={isSubmitting}
            />

            {/* Rating and Opening Hours (read-only from map) */}
            {(formData.rating || formData.openingHours) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {formData.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '12px', color: '#666' }}>
                    <Star size={12} />
                    <span>{formData.rating.toFixed(1)}/5</span>
                  </div>
                )}
                {formData.openingHours && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '12px', color: '#666' }}>
                    <Time size={12} />
                    <span>{formData.openingHours}</span>
                  </div>
                )}
              </div>
            )}

            {/* Category Buttons */}
            <div>
              <label style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                display: 'block',
                color: '#161616'
              }}>
                Category *
              </label>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem' 
              }}>
                {LOCATION_CATEGORIES.map((cat) => {
                  const IconComponent = getCategoryIcon(cat.value);
                  const isSelected = formData.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleChange('category', cat.value)}
                      disabled={isSubmitting}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: isSelected ? '2px solid #0f62fe' : '1px solid #e0e0e0',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#e8f4ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.15s',
                        fontSize: '0.8125rem',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#a8a8a8';
                          e.currentTarget.style.backgroundColor = '#f4f4f4';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <IconComponent size={16} style={{ color: isSelected ? '#0f62fe' : '#525252' }} />
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            {isEnriching && (
              <div style={{ marginBottom: '0.5rem', fontSize: '12px', color: '#525252', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loading withOverlay={false} small description="" />
                <span>Loading details from Wikipedia…</span>
              </div>
            )}
            <TextArea
              id="location-description"
              labelText="Description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter description"
              rows={4}
              disabled={isSubmitting}
            />
          </Stack>
      </div>

      {isSubmitting && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <Loading description={isEditMode ? 'Updating location...' : 'Adding location...'} withOverlay={false} small />
        </div>
      )}
    </Modal>
  );
}

export default LocationFormModal;
