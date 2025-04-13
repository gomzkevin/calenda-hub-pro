
import React from 'react';
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

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
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
          <ScrollArea className="flex-1 w-full">
            <div className="relative min-w-max">
              <div className="grid grid-cols-[160px_repeat(15,minmax(45px,1fr))]">
                {/* Property header cell */}
                <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
                  Properties
                </div>
                
                {/* Day header cells */}
                {visibleDays.map((day, index) => (
                  <DayHeader key={index} day={day} index={index} />
                ))}
                
                {/* Property rows with day cells */}
                {properties.map((property) => (
                  <PropertyRow
                    key={property.id}
                    property={property}
                    visibleDays={visibleDays}
                    getDayReservationStatus={getDayReservationStatus}
                    sortReservations={sortReservations}
                    propertyLanes={propertyLanes}
                    getReservationStyle={getReservationStyle}
                    getSourceReservationInfo={getSourceReservationInfo}
                    normalizeDate={normalizeDate}
                    getReservationsForProperty={getReservationsForProperty}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
          
          {/* Calendar Legend */}
          <CalendarLegend className="mt-auto" />
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
