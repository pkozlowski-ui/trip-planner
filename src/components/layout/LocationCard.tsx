import { forwardRef } from 'react';
import { Location } from '../../types';
import { OverflowMenuVertical, Star, Time, Image as ImageIcon, Video, Link as LinkIcon } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem, Tile } from '@carbon/react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import ImageWithPlaceholder from '../ui/ImageWithPlaceholder';

interface LocationCardProps {
  location: Location;
  isHighlighted?: boolean;
  onClick?: () => void;
  onEdit?: (location: Location) => void;
  onDelete?: (locationId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(({ location, isHighlighted = false, onClick, onEdit, onDelete, dragHandleProps }, ref) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(location);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
      onDelete(location.id);
    }
  };

  const content = (
    <>
      <div className={`location-card__body ${onEdit || onDelete ? 'location-card__body--with-actions' : ''}`}>
        <div className="location-card__title-row">
          {location.image?.trim() ? (
            <div className="location-card__thumb">
              <ImageWithPlaceholder
                src={location.image}
                alt=""
                width={48}
                height={48}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="location-card__icon-box" aria-hidden>
              {(() => {
                try {
                  const IconComponent = getCategoryIcon(location.category);
                  return <IconComponent size={24} style={{ color: 'var(--cds-text-secondary)' }} />;
                } catch (err) {
                  return null;
                }
              })()}
            </div>
          )}
          <h5 className="location-card__title">{location.name}</h5>
          {(onEdit || onDelete) && (
            <div className="location-card__actions" onClick={(e) => e.stopPropagation()}>
              <OverflowMenu
                renderIcon={OverflowMenuVertical}
                size="sm"
                flipped
                ariaLabel="Location options"
              >
                {onEdit && (
                  <OverflowMenuItem
                    itemText="Edit"
                    onClick={handleEdit}
                  />
                )}
                {onDelete && (
                  <OverflowMenuItem
                    itemText="Delete"
                    onClick={handleDelete}
                    isDelete
                    hasDivider={!!onEdit}
                  />
                )}
              </OverflowMenu>
            </div>
          )}
        </div>
        <div className="location-card__meta-stack">
          <span className="location-card__meta-item">{location.category}</span>
          {location.openingHours && (
            <span className="location-card__meta-item">
              <Time size={12} aria-hidden />
              {location.openingHours}
            </span>
          )}
          {location.rating != null && (
            <span className="location-card__meta-item location-card__meta-item--rating">
              <Star size={12} aria-hidden />
              {location.rating.toFixed(1)}/5
            </span>
          )}
          {location.media && location.media.length > 0 && (
            <>
              {location.media.filter(m => m.type === 'image').length > 0 && (
                <span className="location-card__meta-item">
                  <ImageIcon size={12} aria-hidden />
                  {location.media.filter(m => m.type === 'image').length}
                </span>
              )}
              {location.media.filter(m => m.type === 'youtube').length > 0 && (
                <span className="location-card__meta-item">
                  <Video size={12} aria-hidden />
                  {location.media.filter(m => m.type === 'youtube').length}
                </span>
              )}
              {location.media.filter(m => m.type === 'link').length > 0 && (
                <span className="location-card__meta-item">
                  <LinkIcon size={12} aria-hidden />
                  {location.media.filter(m => m.type === 'link').length}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <Tile
      ref={ref}
      className={`location-card ${isHighlighted ? 'location-card--highlighted' : ''}`}
      onClick={onClick}
      {...dragHandleProps}
    >
      {content}
    </Tile>
  );
});

LocationCard.displayName = 'LocationCard';

export default LocationCard;
