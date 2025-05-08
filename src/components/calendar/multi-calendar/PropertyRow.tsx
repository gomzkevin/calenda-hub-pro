
import React, { useMemo, memo } from 'react';
import { Property, Reservation } from '@/types';
import DayCell from './DayCell';

interface PropertyRowProps {
  property: Property;
  visibleDays: Date[];
  getDayReservationStatus: (property: Property, day: Date) => {
    hasReservation: boolean;
    isIndirect: boolean;
    reservations: any[];
  };
  sortReservations: (resA: any, resB: any) => number;
  propertyLanes: Map<string, number>;
  getReservationStyle: (reservation: any, isIndirect: boolean) => string;
  getSourceReservationInfo: (reservation: any) => { property?: Property, reservation?: any };
  normalizeDate: (date: Date) => Date;
  onClick?: () => void;
}

// Add memoization to prevent unnecessary re-renders
const PropertyRow: React.FC<PropertyRowProps> = memo(({
  property,
  visibleDays,
  getDayReservationStatus,
  sortReservations,
  propertyLanes,
  getReservationStyle,
  getSourceReservationInfo,
  normalizeDate,
  onClick
}) => {
  // Determine type indicator based on property type - memoized to prevent recalculation
  const typeIndicator = useMemo(() => {
    if (property.type === 'parent') return 'Alojamiento principal';
    if (property.type === 'child') return 'Habitación';
    return 'Casa'; // Default for 'standalone' or undefined type
  }, [property.type]);

  // Group days into weeks for reservation bar rendering - memoized for performance
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < visibleDays.length; i += 7) {
      result.push(visibleDays.slice(i, i + 7));
    }
    return result;
  }, [visibleDays]);

  // Apply different background colors and border styles based on property type - memoized
  const propertyTypeStyles = useMemo(() => {
    if (property.type === 'parent') return 'bg-blue-50/40 border-l-4 border-l-blue-400';
    if (property.type === 'child') return 'bg-amber-50/40 border-l-2 border-l-amber-400';
    return 'bg-purple-50/40 border-l-3 border-l-purple-400'; // Default for 'standalone' or undefined type
  }, [property.type]);

  // Add cursor-pointer if onClick is provided
  const cursorStyle = onClick ? 'cursor-pointer hover:bg-gray-50' : '';

  // Memoize day cells to prevent unnecessary re-renders
  const dayCells = useMemo(() => {
    return visibleDays.map((day, dayIndex) => (
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
    ));
  }, [
    visibleDays, 
    property, 
    getDayReservationStatus, 
    sortReservations, 
    propertyLanes, 
    getReservationStyle, 
    getSourceReservationInfo, 
    normalizeDate
  ]);

  return (
    <React.Fragment>
      <div
        className={`sticky left-0 z-10 bg-white border-b border-r border-gray-100/80 p-3 font-medium truncate h-16 transition-colors ${propertyTypeStyles} shadow-sm ${cursorStyle}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        aria-label={onClick ? `View ${property.name} calendar` : undefined}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{property.name}</span>
          {typeIndicator && (
            <span className="text-xs text-gray-500 mt-1">
              {typeIndicator}
            </span>
          )}
        </div>
      </div>
      
      {dayCells}
    </React.Fragment>
  );
});

export default PropertyRow;
