
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/property';
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

interface MultiCalendarProps {
  onPropertyClick?: (propertyId: string) => void;
}

const MultiCalendar: React.FC<MultiCalendarProps> = ({ onPropertyClick }) => {
  // Set up date navigation
  const { startDate, endDate, visibleDays, goForward, goBackward } = useDateNavigation();
  
  // Fetch reservations for the visible date range with optimized parameters
  const { reservations, isLoading: isLoadingReservations } = useReservations(startDate, endDate);
  
  // Fetch properties with improved caching
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false // Don't refetch on window focus
  });
  
  // Create property relationship maps - now memoized 
  const propertyRelationships = usePropertyRelationships(properties);

  // Set up reservation-related functions
  const { 
    getReservationsForProperty, 
    getSourceReservationInfo, 
    getDayReservationStatus 
  } = useReservationData(reservations, properties, propertyRelationships);

  // Calculate property lanes for positioning reservations - memoized for performance
  const propertyLanes = useMemo(() => 
    calculatePropertyLanes(properties, getReservationsForProperty),
    [properties, getReservationsForProperty]
  );

  // Combined loading state
  const isLoading = isLoadingReservations || isLoadingProperties;

  // Memoize the property rows to prevent unnecessary re-renders
  const propertyRows = useMemo(() => {
    if (isLoading) return null;
    
    return properties.map((property) => (
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
        onClick={onPropertyClick ? () => onPropertyClick(property.id) : undefined}
      />
    ));
  }, [
    properties, 
    visibleDays, 
    getDayReservationStatus, 
    propertyLanes, 
    getSourceReservationInfo,
    onPropertyClick,
    isLoading
  ]);

  // Memoize the day headers to prevent unnecessary re-renders
  const dayHeaders = useMemo(() => {
    return visibleDays.map((day, index) => (
      <DayHeader key={index} day={day} index={index} />
    ));
  }, [visibleDays]);

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
        <div className="flex flex-col h-[calc(100%-60px)] content-start">
          <ScrollArea className="w-full flex-grow">
            <div className="relative min-w-max">
              <div className="grid grid-cols-[160px_repeat(15,minmax(45px,1fr))]">
                {/* Property header cell */}
                <div className="sticky top-0 left-0 z-20 bg-white border-b border-r border-gray-200 h-12 flex items-center justify-center font-medium text-gray-700 shadow-sm">
                  Properties
                </div>
                
                {/* Day header cells */}
                {dayHeaders}
                
                {/* Property rows with day cells */}
                {propertyRows}
              </div>
            </div>
          </ScrollArea>
          
          {/* Calendar Legend */}
          <CalendarLegend className="mt-auto border-t border-gray-200 py-2" />
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
