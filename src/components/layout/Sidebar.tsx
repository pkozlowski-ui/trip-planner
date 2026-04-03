import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Loading } from '@carbon/react';
import { Add, ChevronRight, ChevronLeft } from '@carbon/icons-react';
import { useTripPlans } from '../../contexts/TripPlansContext';
import { createDay } from '../../services/firebase/firestore';
import { Location, Transport, Day } from '../../types';
import DaySection from './DaySection';
import LocationCard from './LocationCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

interface SidebarProps {
  selectedLocationId?: string | null;
  onLocationClick?: (locationId: string) => void;
  onLocationEdit?: (location: Location) => void;
  onLocationDelete?: (locationId: string) => void;
  onTransportAdd?: (fromLocationId: string, toLocationId: string) => void;
  onTransportEdit?: (transport: Transport) => void;
  onTransportDelete?: (transportId: string) => void;
  onLocationMove?: (locationId: string, sourceDayId: string, targetDayId: string, newOrder: number) => Promise<void>;
  allDays?: Day[];
  locationRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

function Sidebar({ 
  selectedLocationId = null, 
  onLocationClick, 
  onLocationEdit, 
  onLocationDelete,
  onTransportAdd,
  onTransportEdit,
  onTransportDelete,
  onLocationMove,
  allDays = [],
  locationRefs,
}: SidebarProps) {
  const { planId } = useParams<{ planId: string }>();
  const { currentPlan, loadPlan } = useTripPlans();
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveId(null);

    if (!over || !onLocationMove || !currentPlan) {
      return;
    }

    const locationId = active.id as string;
    
    // Find source day (where location currently is)
    const sourceDay = currentPlan.days.find((d) => 
      d.locations.some((loc) => loc.id === locationId)
    );

    if (!sourceDay) {
      return;
    }

    // Check if dropped on a day container or another location
    let targetDayId: string;
    let newOrder: number;

    if (over.id.toString().startsWith('day-')) {
      // Dropped on a day container
      targetDayId = over.id.toString().replace('day-', '');
      const targetDay = currentPlan.days.find((d) => d.id === targetDayId);
      if (!targetDay) return;
      // Add to end of target day
      newOrder = targetDay.locations.length;
    } else {
      // Dropped on another location
      const targetLocationId = over.id as string;
      const targetDay = currentPlan.days.find((d) => 
        d.locations.some((loc) => loc.id === targetLocationId)
      );
      
      if (!targetDay) {
        return;
      }

      targetDayId = targetDay.id;
      const targetIndex = targetDay.locations.findIndex((loc) => loc.id === targetLocationId);
      newOrder = targetIndex;
    }

    // Only move if source and target are different or order changed
    if (sourceDay.id !== targetDayId || sourceDay.locations.findIndex((loc) => loc.id === locationId) !== newOrder) {
      // Remove transports from source day if location is being moved
      if (sourceDay.id !== targetDayId) {
        // Remove all transports connected to this location in source day
        const transportsToRemove = sourceDay.transports?.filter(
          (t) => t.fromLocationId === locationId || t.toLocationId === locationId
        ) || [];
        
        for (const transport of transportsToRemove) {
          if (onTransportDelete) {
            await onTransportDelete(transport.id);
          }
        }
      } else {
        // Same day - check if transport exists between affected locations
        const oldIndex = sourceDay.locations.findIndex((loc) => loc.id === locationId);
        const affectedLocations = [
          sourceDay.locations[Math.min(oldIndex, newOrder)],
          sourceDay.locations[Math.min(oldIndex, newOrder) + 1],
        ].filter(Boolean);

        if (affectedLocations.length === 2) {
          const transport = sourceDay.transports?.find(
            (t) => t.fromLocationId === affectedLocations[0].id && t.toLocationId === affectedLocations[1].id
          );
          if (transport && onTransportDelete) {
            await onTransportDelete(transport.id);
          }
        }
      }

      // Move location
      await onLocationMove(locationId, sourceDay.id, targetDayId, newOrder);
    }
  };

  const handleDragCancel = () => {
    setIsDragging(false);
    setActiveId(null);
  };

  const activeLocation = activeId && currentPlan
    ? currentPlan.days
        .flatMap((d) => d.locations)
        .find((loc) => loc.id === activeId)
    : null;

  const handleAddDay = async () => {
    if (!planId || planId === 'new' || !currentPlan) {
      console.error('Cannot add day: invalid planId or no current plan');
      return;
    }

    setIsAddingDay(true);
    try {
      // Calculate next day number
      const nextDayNumber = currentPlan.days.length > 0
        ? Math.max(...currentPlan.days.map(d => d.dayNumber)) + 1
        : 1;

      // Create the day
      await createDay(planId, {
        dayNumber: nextDayNumber,
      });

      // Reload plan to show new day
      await loadPlan(planId);
    } catch (error: any) {
      console.error('Error adding day:', error);
      alert(error.message || 'Failed to add day');
    } finally {
      setIsAddingDay(false);
    }
  };

  // For new plans (planId === 'new') or when planId is not yet available, show empty state
  if (!currentPlan) {
    const isNewPlan = !planId || planId === 'new';
    
    return (
      <aside
        style={{
          width: '320px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          padding: '1rem',
          overflowY: 'auto',
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          {isNewPlan ? (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '16px', fontWeight: 600, color: '#161616' }}>
                New Trip Plan
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#525252' }}>
                Save your plan to start adding days and locations
              </p>
            </>
          ) : (
            <Loading 
              description="Loading plan..." 
              withOverlay={false}
              small
            />
          )}
        </div>
      </aside>
    );
  }

  const sidebarWidth = isCollapsed ? '64px' : '320px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        transition: 'width 0.3s ease',
      }}
    >
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        {!isCollapsed && <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, flex: 1 }}>Trip Plan</h3>}
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          iconDescription={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setIsCollapsed(!isCollapsed)}
          renderIcon={isCollapsed ? ChevronRight : ChevronLeft}
        />
      </div>

      <div style={{ flex: 1, padding: isCollapsed ? '0.5rem' : '1rem' }}>
        {currentPlan.days.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            {!isCollapsed && <p>No days added yet</p>}
            {!isCollapsed ? (
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={handleAddDay}
                disabled={isAddingDay || !planId || planId === 'new'}
                style={{ marginTop: '1rem' }}
              >
                {isAddingDay ? 'Adding...' : 'Add First Day'}
              </Button>
            ) : (
              <Button
                kind="ghost"
                hasIconOnly
                renderIcon={Add}
                onClick={handleAddDay}
                disabled={isAddingDay || !planId || planId === 'new'}
                iconDescription="Add day"
                style={{ 
                  backgroundColor: '#f4f4f4',
                  width: '32px',
                  height: '32px',
                }}
              />
            )}
          </div>
        ) : (
          !isCollapsed ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              {currentPlan.days.map((day) => (
                <DaySection
                  key={day.id}
                  day={day}
                  selectedLocationId={selectedLocationId}
                  onLocationClick={onLocationClick}
                  onLocationEdit={onLocationEdit}
                  onLocationDelete={onLocationDelete}
                  onTransportAdd={onTransportAdd}
                  onTransportEdit={onTransportEdit}
                  onTransportDelete={onTransportDelete}
                  onLocationMove={onLocationMove}
                  allDays={allDays}
                  isDragging={isDragging}
                  activeId={activeId}
                  isCollapsed={isCollapsed}
                  locationRefs={locationRefs}
                />
              ))}
              <DragOverlay>
                {activeLocation ? (
                  <div style={{ opacity: 0.8 }}>
                    <LocationCard
                      location={activeLocation}
                      isHighlighted={false}
                      dragHandleProps={{}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            currentPlan.days.map((day) => (
              <DaySection
                key={day.id}
                day={day}
                selectedLocationId={selectedLocationId}
                onLocationClick={onLocationClick}
                onLocationEdit={onLocationEdit}
                onLocationDelete={onLocationDelete}
                onTransportAdd={onTransportAdd}
                onTransportEdit={onTransportEdit}
                onTransportDelete={onTransportDelete}
                onLocationMove={onLocationMove}
                allDays={allDays}
                isDragging={false}
                activeId={null}
                isCollapsed={isCollapsed}
                locationRefs={locationRefs}
              />
            ))
          )
        )}
      </div>

      {currentPlan.days.length > 0 && (
        <div style={{ padding: isCollapsed ? '0.5rem' : '1rem', borderTop: '1px solid #e0e0e0' }}>
          {isCollapsed ? (
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={Add}
              onClick={handleAddDay}
              disabled={isAddingDay || !planId || planId === 'new'}
              iconDescription="Add day"
              style={{ 
                backgroundColor: '#f4f4f4',
                width: '100%',
                height: '32px',
              }}
            />
          ) : (
            <Button
              kind="secondary"
              renderIcon={Add}
              onClick={handleAddDay}
              disabled={isAddingDay || !planId || planId === 'new'}
              style={{ width: '100%' }}
            >
              {isAddingDay ? 'Adding...' : 'Add Another Day'}
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;


