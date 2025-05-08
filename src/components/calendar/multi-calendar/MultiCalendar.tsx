
import React, { useMemo } from 'react';
import { useReservationData } from './hooks/useReservationData';
import { useDateNavigation } from './hooks/useDateNavigation';
import { usePropertyRelationships } from './hooks/usePropertyRelationships';
import MultiCalendarHeader from './MultiCalendarHeader';
import DayHeader from './DayHeader';
import PropertyRow from './PropertyRow';
import { Property } from '@/types';
import { Card } from '@/components/ui/card';
import { getReservationStyle } from '../utils/styleCalculation';
import {
  normalizeDate,
  isSameDate,
  sortReservationsByStartDate
} from '../utils/dateUtils';

interface MultiCalendarProps {
  onPropertySelect?: (propertyId: string) => void;
}

const MultiCalendarComponent: React.FC<MultiCalendarProps> = ({ onPropertySelect }) => {
  // Custom hooks for data and navigation
  const { startDate, endDate, visibleDays, goForward, goBackward } = useDateNavigation();
  const { reservations, isLoading } = useReservationData(startDate, endDate);
  const { parentToChildren, childToParent, siblingGroups } = usePropertyRelationships(reservations);
  
  // Extract month and year from the first visible day
  const currentMonth = useMemo(() => visibleDays[7]?.getMonth() + 1 || new Date().getMonth() + 1, [visibleDays]);
  const currentYear = useMemo(() => visibleDays[7]?.getFullYear() || new Date().getFullYear(), [visibleDays]);
  
  // Extract properties from reservations
  const properties = useMemo(() => {
    if (!reservations || reservations.length === 0) return [];
    
    // Create a map to avoid duplicates
    const propertiesMap = new Map<string, Property>();
    
    reservations.forEach(reservation => {
      if (reservation.property && !propertiesMap.has(reservation.property.id)) {
        propertiesMap.set(reservation.property.id, reservation.property);
      }
    });
    
    return Array.from(propertiesMap.values());
  }, [reservations]);
  
  // Create helper function to get source reservation info 
  const getSourceReservationInfo = (reservation: any) => {
    // Return empty object as a placeholder
    return { property: undefined, reservation: undefined };
  };
  
  // Create a simple property lanes structure
  const propertyLanes = useMemo(() => {
    const lanes = new Map<string, number>();
    properties.forEach(property => {
      lanes.set(property.id, 0);
    });
    return lanes;
  }, [properties]);
  
  // getDayReservationStatus is memoized to improve performance
  const getDayReservationStatus = useMemo(() => {
    return (property: Property, day: Date) => {
      // Skip if reservations aren't loaded yet
      if (!reservations) return { hasReservation: false, isIndirect: false, reservations: [] };
      
      // Efficiently check if there are any reservations for this property on this day
      const normalizedDate = normalizeDate(day);
      const propertyReservations = reservations.filter(res => 
        res.propertyId === property.id && 
        normalizedDate >= normalizeDate(res.startDate) && 
        normalizedDate < normalizeDate(res.endDate)
      );
      
      // Check if any reservations are indirect (from relationships)
      const isIndirect = propertyReservations.some(res => res.isRelationshipBlock || res.sourceReservationId);
      
      return {
        hasReservation: propertyReservations.length > 0,
        isIndirect,
        reservations: propertyReservations
      };
    };
  }, [reservations]);
  
  if (isLoading) {
    return (
      <Card className="w-full h-full p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="w-32 h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
        <div className="flex-grow">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex mb-2">
              <div className="w-40 h-16 bg-gray-200 animate-pulse rounded"></div>
              <div className="flex-grow grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-16 bg-gray-100 animate-pulse rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <MultiCalendarHeader 
        startDate={startDate}
        endDate={endDate}
        goForward={goForward}
        goBackward={goBackward}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[200px_repeat(7,_1fr)] sticky top-0 z-10">
            <div className="bg-white border-b border-gray-200 h-10"></div>
            {visibleDays.map((day, i) => (
              <DayHeader key={i} day={day} dayIndex={i} />
            ))}
          </div>
          
          <div className="grid grid-cols-[200px_repeat(7,_1fr)]">
            {properties.map((property) => (
              <React.Fragment key={property.id}>
                <PropertyRow
                  property={property}
                  visibleDays={visibleDays}
                  getDayReservationStatus={getDayReservationStatus}
                  sortReservations={sortReservationsByStartDate}
                  propertyLanes={propertyLanes}
                  getReservationStyle={getReservationStyle}
                  getSourceReservationInfo={getSourceReservationInfo}
                  normalizeDate={normalizeDate}
                  onPropertySelect={onPropertySelect}
                />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiCalendarComponent;
