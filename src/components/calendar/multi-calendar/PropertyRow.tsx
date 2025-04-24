
import React, { useMemo } from 'react';
import { Property, Reservation } from '@/types';
import DayCell from './DayCell';
import { findReservationPositionInWeek } from '../utils/reservationPosition';
import { calculateBarPositionAndStyle } from '../utils/styleCalculation';

interface PropertyRowProps {
  property: Property;
  visibleDays: Date[];
  width?: string;
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
  width = "70px",
  getDayReservationStatus,
  sortReservations,
  propertyLanes,
  getReservationStyle,
  getSourceReservationInfo,
  normalizeDate
}) => {
  return (
    <React.Fragment>
      {visibleDays.map((day, dayIndex) => (
        <DayCell
          key={`day-${property.id}-${dayIndex}`}
          day={day}
          property={property}
          dayIndex={dayIndex}
          width={width}
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
