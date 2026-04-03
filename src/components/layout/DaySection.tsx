import { useState } from 'react';
import { Day, Location, Transport } from '../../types';
import LocationCard from './LocationCard';
import TransportCard from '../transport/TransportCard';
import { getDayColor } from '../../utils/dayColors';
import { Button } from '@carbon/react';
import { Add, ChevronDown, ChevronRight } from '@carbon/icons-react';
import {
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DaySectionProps {
  day: Day;
  selectedLocationId?: string | null;
  onLocationClick?: (locationId: string) => void;
  onLocationEdit?: (location: Location) => void;
  onLocationDelete?: (locationId: string) => void;
  onTransportAdd?: (fromLocationId: string, toLocationId: string) => void;
  onTransportEdit?: (transport: Transport) => void;
  onTransportDelete?: (transportId: string) => void;
  onLocationMove?: (locationId: string, sourceDayId: string, targetDayId: string, newOrder: number) => Promise<void>;
  allDays?: Day[]; // All days for cross-day dragging
  isDragging?: boolean; // Whether any location is being dragged
  activeId?: string | null; // ID of currently dragged location
  isCollapsed?: boolean; // Whether sidebar is collapsed
  locationRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

interface SortableLocationItemProps {
  location: Location;
  isHighlighted: boolean;
  onLocationClick?: () => void;
  onLocationEdit?: (location: Location) => void;
  onLocationDelete?: (locationId: string) => void;
  transport?: Transport;
  nextLocation?: Location | null;
  dayNumber: number;
  onTransportAdd?: (fromLocationId: string, toLocationId: string) => void;
  onTransportEdit?: (transport: Transport) => void;
  onTransportDelete?: (transportId: string) => void;
  isDragging: boolean;
  locationRef?: (el: HTMLDivElement | null) => void;
}

function SortableLocationItem({
  location,
  isHighlighted,
  onLocationClick,
  onLocationEdit,
  onLocationDelete,
  transport,
  nextLocation,
  dayNumber,
  onTransportAdd,
  onTransportEdit,
  onTransportDelete,
  isDragging,
  locationRef,
}: SortableLocationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: itemIsDragging,
  } = useSortable({ id: location.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: itemIsDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LocationCard
        ref={locationRef}
        location={location}
        isHighlighted={isHighlighted}
        onClick={onLocationClick}
        onEdit={onLocationEdit}
        onDelete={onLocationDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      {!isDragging && nextLocation && (
        <>
          {transport ? (
            <TransportCard
              transport={transport}
              dayNumber={dayNumber}
              fromLocationName={location.name}
              toLocationName={nextLocation.name}
              onEdit={onTransportEdit}
              onDelete={onTransportDelete}
            />
          ) : (
            onTransportAdd && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={Add}
                  onClick={() => onTransportAdd(location.id, nextLocation.id)}
                  style={{ 
                    fontSize: '10px',
                    padding: '0.25rem 0.5rem',
                    minHeight: '24px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '2px',
                    color: '#666',
                    fontWeight: 400,
                  }}
                >
                  Add Transport
                </Button>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function DaySection({ 
  day, 
  selectedLocationId = null, 
  onLocationClick, 
  onLocationEdit, 
  onLocationDelete,
  onTransportAdd,
  onTransportEdit,
  onTransportDelete,
  onLocationMove: _onLocationMove,
  allDays: _allDays = [],
  isDragging = false,
  activeId: _activeId = null,
  isCollapsed = false,
  locationRefs,
}: DaySectionProps) {
  const dayColor = getDayColor(day.dayNumber || 1);
  const [isDayExpanded, setIsDayExpanded] = useState(true);
  
  // Make the day section droppable
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `day-${day.id}`,
  });
  
  // Helper function to get transport between two locations
  const getTransportBetween = (fromLocationId: string, toLocationId: string): Transport | undefined => {
    return day.transports?.find(
      t => t.fromLocationId === fromLocationId && t.toLocationId === toLocationId
    );
  };
  
  if (isCollapsed) {
    return (
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: dayColor,
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    );
  }

  return (
    <div 
      ref={setDroppableRef}
      style={{ 
        marginBottom: '1.5rem',
        backgroundColor: isOver ? '#f0f7ff' : 'transparent',
        borderRadius: '4px',
        padding: isOver ? '0.5rem' : '0',
        transition: 'background-color 0.2s',
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: isDayExpanded ? '0.75rem' : '0',
        cursor: 'pointer',
      }}
      onClick={() => setIsDayExpanded(!isDayExpanded)}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: dayColor,
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
        <h4
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          DAY {day.dayNumber}
          {day.date && (
            <span style={{ fontWeight: 400, marginLeft: '0.5rem' }}>
              • {day.date.toLocaleDateString()}
            </span>
          )}
        </h4>
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          iconDescription={isDayExpanded ? 'Collapse day' : 'Expand day'}
          onClick={(e) => {
            e.stopPropagation();
            setIsDayExpanded(!isDayExpanded);
          }}
          renderIcon={isDayExpanded ? ChevronDown : ChevronRight}
          style={{ minWidth: '24px', width: '24px', height: '24px' }}
        />
      </div>
      {isDayExpanded && (
        <>
          {day.locations.length === 0 ? (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f4f4f4',
                borderRadius: '4px',
                textAlign: 'center',
                color: '#666',
                fontSize: '12px',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isOver ? 'Drop location here' : 'No locations added'}
            </div>
          ) : (
            <SortableContext items={day.locations.map((loc) => loc.id)} strategy={verticalListSortingStrategy}>
              {day.locations.map((location, index) => {
                const isLast = index === day.locations.length - 1;
                const nextLocation = !isLast ? day.locations[index + 1] : null;
                const transport = nextLocation ? getTransportBetween(location.id, nextLocation.id) : undefined;

                return (
                  <SortableLocationItem
                    key={location.id}
                    location={location}
                    isHighlighted={selectedLocationId === location.id}
                    onLocationClick={() => onLocationClick?.(location.id)}
                    onLocationEdit={onLocationEdit}
                    onLocationDelete={onLocationDelete}
                    transport={transport}
                    nextLocation={nextLocation}
                    dayNumber={day.dayNumber || 1}
                    onTransportAdd={onTransportAdd}
                    onTransportEdit={onTransportEdit}
                    onTransportDelete={onTransportDelete}
                    isDragging={isDragging}
                    locationRef={locationRefs ? (el) => {
                      if (locationRefs.current) {
                        locationRefs.current[location.id] = el;
                      }
                    } : undefined}
                  />
                );
              })}
            </SortableContext>
          )}
        </>
      )}
    </div>
  );
}

export default DaySection;
