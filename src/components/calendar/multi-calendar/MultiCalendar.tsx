
import React, { useState, useMemo, useCallback } from 'react';
import { addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { Reservation, Property } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

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

// Define the number of days to show in the multi-calendar view
const DAYS_TO_SHOW = 15;

const MultiCalendar: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  // Calculate end date and month information
  const endDate = addDays(startDate, DAYS_TO_SHOW - 1);
  const startMonth = startDate.getMonth() + 1;
  const startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  
  // Determine which months to fetch
  const monthsToFetch = [
    { month: startMonth, year: startYear },
  ];
  
  if (startMonth !== endMonth || startYear !== endYear) {
    monthsToFetch.push({ month: endMonth, year: endYear });
  }
  
  // Fetch reservations for the visible date range
  const reservationsQueries = useQuery({
    queryKey: ['reservations', 'multi', monthsToFetch],
    queryFn: async () => {
      const promises = monthsToFetch.map(({ month, year }) => 
        getReservationsForMonth(month, year)
      );
      const results = await Promise.all(promises);
      return results.flat();
    }
  });
  
  // Filter reservations
  const reservations = (reservationsQueries.data || []).filter(res => {
    if (res.notes !== 'Blocked') return true;
    if (res.sourceReservationId || res.isBlocking) return true;
    return false;
  });
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  // Navigation handlers
  const goForward = () => {
    setStartDate(addDays(startDate, DAYS_TO_SHOW));
  };
  
  const goBackward = () => {
    setStartDate(addDays(startDate, -DAYS_TO_SHOW));
  };
  
  // Generate array of visible days
  const visibleDays = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
    addDays(startDate, i)
  );
  
  // Helper function to get reservations for a property
  const getReservationsForProperty = useCallback((propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  }, [reservations]);

  // Create property relationship maps
  const propertyRelationships = useMemo(() => {
    const relationships = new Map<string, string[]>();
    const childToParent = new Map<string, string>();
    
    properties.forEach(property => {
      if (property.type === 'parent') {
        relationships.set(property.id, []);
      } else if (property.type === 'child' && property.parentId) {
        const children = relationships.get(property.parentId) || [];
        children.push(property.id);
        relationships.set(property.parentId, children);
        
        childToParent.set(property.id, property.parentId);
      }
    });
    
    return { parentToChildren: relationships, childToParent };
  }, [properties]);

  // Calculate property lanes for positioning reservations
  const propertyLanes = useMemo(() => 
    calculatePropertyLanes(properties, getReservationsForProperty),
  [properties, getReservationsForProperty]);

  // Get source reservation info for linked reservations
  const getSourceReservationInfo = useCallback((reservation: Reservation): { property?: Property, reservation?: Reservation } => {
    if (!reservation.sourceReservationId) return {};
    
    const sourceReservation = reservations.find(r => r.id === reservation.sourceReservationId);
    if (!sourceReservation) return {};
    
    const sourceProperty = properties.find(p => p.id === sourceReservation.propertyId);
    
    return { property: sourceProperty, reservation: sourceReservation };
  }, [reservations, properties]);

  // Determine reservation status for a property on a specific day
  const getDayReservationStatus = useCallback((property: Property, day: Date) => {
    const normalizedDay = normalizeDate(day);
    
    // Check for direct reservations on this property
    const directReservations = getReservationsForProperty(property.id).filter(res => {
      const normalizedStart = normalizeDate(res.startDate);
      const normalizedEnd = normalizeDate(res.endDate);
      return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
    });
    
    if (directReservations.length > 0) {
      return { 
        hasReservation: true, 
        isIndirect: false,
        reservations: directReservations
      };
    }
    
    // For parent properties, check child reservations
    if (property.type === 'parent') {
      const childrenIds = propertyRelationships.parentToChildren.get(property.id) || [];
      
      for (const childId of childrenIds) {
        const childReservations = getReservationsForProperty(childId).filter(res => {
          const normalizedStart = normalizeDate(res.startDate);
          const normalizedEnd = normalizeDate(res.endDate);
          return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
        });
        
        if (childReservations.length > 0) {
          return { 
            hasReservation: true, 
            isIndirect: true,
            reservations: childReservations
          };
        }
      }
    }
    
    // For child properties, check parent reservations
    if (property.type === 'child' && property.parentId) {
      const parentReservations = getReservationsForProperty(property.parentId).filter(res => {
        const normalizedStart = normalizeDate(res.startDate);
        const normalizedEnd = normalizeDate(res.endDate);
        return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
      });
      
      if (parentReservations.length > 0) {
        return { 
          hasReservation: true, 
          isIndirect: true,
          reservations: parentReservations
        };
      }
    }
    
    // No reservations found
    return { 
      hasReservation: false, 
      isIndirect: false,
      reservations: []
    };
  }, [getReservationsForProperty, properties, propertyRelationships.parentToChildren]);

  const isLoading = reservationsQueries.isLoading || isLoadingProperties;

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
        <ScrollArea className="h-[calc(100%-60px)] w-full">
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
              {properties.map((property: Property) => (
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
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default MultiCalendar;
