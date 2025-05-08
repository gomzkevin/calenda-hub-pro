
import React, { useMemo } from 'react';
import { Property, Reservation } from '@/types';
import DayCell from './DayCell';
import { findReservationPositionInWeek } from '../utils/reservationPosition';
import { calculateBarPositionAndStyle } from '../utils/styleCalculation';

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
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  property,
  visibleDays,
  getDayReservationStatus,
  sortReservations,
  propertyLanes,
  getReservationStyle,
  getSourceReservationInfo,
  normalizeDate
}) => {
  const typeIndicator = 
    property.type === 'parent' ? 'Alojamiento principal' : 
    property.type === 'child' ? 'Habitación' : '';

  // Group days into weeks for reservation bar rendering
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < visibleDays.length; i += 7) {
      result.push(visibleDays.slice(i, i + 7));
    }
    return result;
  }, [visibleDays]);

  // Apply different background colors based on property type
  const propertyTypeStyles = 
    property.type === 'parent' ? 'bg-blue-50/30' : 
    property.type === 'child' ? 'bg-amber-50/30' : '';

  return (
    <React.Fragment>
      <div className={`sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-3 font-medium truncate h-16 ${propertyTypeStyles}`}>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{property.name}</span>
          {typeIndicator && (
            <span className="text-xs text-gray-500 mt-1">
              {typeIndicator}
            </span>
          )}
        </div>
      </div>
      
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
        />
      ))}
    </React.Fragment>
  );
};

export default PropertyRow;
