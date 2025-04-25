
import React, { useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';
import { ScrollArea } from '@/components/ui/scroll-area';
import CalendarLegend from '../CalendarLegend';

// Import hooks
import { useReservations } from './hooks/useReservations';
import { useDateNavigation } from './hooks/useDateNavigation';
import { usePropertyRelationships } from './hooks/usePropertyRelationships';
import { useReservationData } from './hooks/useReservationData';

// Import components
import MultiCalendarHeader from './MultiCalendarHeader';
import DayHeader from './DayHeader';
import DayCell from './DayCell';

// Import utilities
import { 
  normalizeDate, 
  sortReservations, 
  getReservationStyle,
  calculatePropertyLanes
} from './utils';

const MultiCalendar: React.FC = () => {
  // Set up date navigation
  const { startDate, endDate, visibleDays, goForward, goBackward } = useDateNavigation();
  
  // Fetch reservations for the visible date range
  const { reservations, isLoading: isLoadingReservations } = useReservations(startDate, endDate);
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  // Create property relationship maps
  const propertyRelationships = usePropertyRelationships(properties);

  // Set up reservation-related functions
  const { 
    getReservationsForProperty, 
    getSourceReservationInfo, 
    getDayReservationStatus 
  } = useReservationData(reservations, properties, propertyRelationships);

  // Calculate property lanes for positioning reservations
  const propertyLanes = React.useMemo(() => 
    calculatePropertyLanes(properties, getReservationsForProperty),
  [properties, getReservationsForProperty]);

  // Refs for synchronized scrolling
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const daysScrollRef = useRef<HTMLDivElement>(null);

  // Functions to synchronize scrolling
  const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (daysScrollRef.current) {
      daysScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const handleDaysScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const isLoading = isLoadingReservations || isLoadingProperties;

  // Calculate cell width
  const cellWidth = "80px"; // Consistent width for day cells

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden multi-calendar-container">
      <MultiCalendarHeader 
        startDate={startDate}
        visibleDays={visibleDays}
        onPrev={goBackward}
        onNext={goForward}
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100%-60px)]">
          {/* Headers Section */}
          <div className="flex w-full border-b">
            {/* Fixed property header */}
            <div className="sticky left-0 w-[160px] min-w-[160px] z-20 bg-white border-r h-10 flex items-center justify-center font-medium">
              Properties
            </div>
            
            {/* Scrollable day headers */}
            <div 
              className="flex-1 overflow-x-auto calendar-scroll-area"
              ref={headerScrollRef}
              onScroll={handleHeaderScroll}
            >
              <div className="flex" style={{ minWidth: `calc(${cellWidth} * ${visibleDays.length})` }}>
                {visibleDays.map((day, index) => (
                  <DayHeader 
                    key={index} 
                    day={day} 
                    index={index} 
                    width={cellWidth}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Main Calendar Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Fixed property column */}
            <div className="sticky left-0 w-[160px] min-w-[160px] z-10 bg-white border-r">
              {properties.map((property) => (
                <div 
                  key={`property-${property.id}`} 
                  className="border-b p-2 font-medium truncate h-16"
                >
                  <div className="flex flex-col">
                    <span>{property.name}</span>
                    {property.type === 'parent' ? (
                      <span className="text-xs text-muted-foreground mt-1">
                        Alojamiento principal
                      </span>
                    ) : property.type === 'child' ? (
                      <span className="text-xs text-muted-foreground mt-1">
                        Habitación
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scrollable days content */}
            <div 
              className="flex-1 overflow-x-auto calendar-scroll-area"
              ref={daysScrollRef}
              onScroll={handleDaysScroll}
            >
              <div 
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${visibleDays.length}, ${cellWidth})`,
                  gridTemplateRows: `repeat(${properties.length}, 4rem)`,
                  minWidth: `calc(${cellWidth} * ${visibleDays.length})`,
                }}
              >
                {properties.map((property) => (
                  visibleDays.map((day, dayIndex) => (
                    <DayCell
                      key={`day-${property.id}-${dayIndex}`}
                      day={day}
                      property={property}
                      dayIndex={dayIndex}
                      getDayReservationStatus={getDayReservationStatus}
                      sortReservations={sortReservations}
                      propertyLanes={propertyLanes}
                      getReservationStyle={getReservationStyle}
                      getSourceReservationInfo={getSourceReservationInfo}
                      normalizeDate={normalizeDate}
                    />
                  ))
                ))}
              </div>
            </div>
          </div>
          
          {/* Calendar Legend */}
          <CalendarLegend className="mt-auto" />
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
