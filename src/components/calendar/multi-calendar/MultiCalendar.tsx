
import React, { useRef, useCallback } from 'react';
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
import PropertyRow from './PropertyRow';

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
  
  // Refs for synchronized scrolling
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  
  // Handlers for synchronized scrolling
  const handleHeaderScroll = useCallback((position: number) => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollLeft = position;
    }
  }, []);
  
  const handleMainScroll = useCallback((position: number) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = position;
    }
  }, []);
  
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

  const isLoading = isLoadingReservations || isLoadingProperties;
  const cellWidth = "70px"; // Consistent width for all day cells

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
          <div className="flex w-full">
            {/* Fixed property header cell */}
            <div className="sticky left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium w-[160px]">
              Properties
            </div>
            
            {/* Scrollable day headers */}
            <ScrollArea 
              className="flex-1 overflow-x-auto"
              orientation="horizontal"
              scrollHideDelay={0}
              ref={headerScrollRef}
              onScrollPositionChange={({ x }) => handleHeaderScroll(x || 0)}
            >
              <div className="flex min-w-max">
                {visibleDays.map((day, index) => (
                  <DayHeader key={index} day={day} index={index} width={cellWidth} />
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Fixed property column */}
            <div className="w-[160px] z-10 bg-white border-r flex-shrink-0">
              {properties.map((property) => (
                <div 
                  key={`property-${property.id}`} 
                  className="border-b p-2 font-medium truncate h-16"
                >
                  <div className="flex flex-col">
                    <span>{property.name}</span>
                    {property.type === 'parent' && (
                      <span className="text-xs text-muted-foreground mt-1">
                        Alojamiento principal
                      </span>
                    )}
                    {property.type === 'child' && (
                      <span className="text-xs text-muted-foreground mt-1">
                        Habitación
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scrollable day cells */}
            <ScrollArea 
              className="flex-1 overflow-x-auto"
              orientation="horizontal"
              scrollHideDelay={0}
              ref={mainScrollRef}
              onScrollPositionChange={({ x }) => handleMainScroll(x || 0)}
            >
              <div className="min-w-max">
                {properties.map((property) => (
                  <div key={`row-${property.id}`} className="flex h-16">
                    {visibleDays.map((day, dayIndex) => (
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
                        width={cellWidth}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Calendar Legend */}
          <CalendarLegend className="mt-auto" />
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
