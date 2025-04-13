
import React, { useMemo } from 'react';
import { Property, Reservation } from '@/types';
import DayCell from './DayCell';
import { findReservationPositionInWeek } from '../utils/reservationPosition';
import { calculateBarPositionAndStyle } from '../utils/styleCalculation';
import ReservationBar from '../ReservationBar';

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
  getReservationsForProperty: (propertyId: string) => Reservation[];
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  property,
  visibleDays,
  getDayReservationStatus,
  sortReservations,
  propertyLanes,
  getReservationStyle,
  getSourceReservationInfo,
  normalizeDate,
  getReservationsForProperty
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

  // Get all reservations for this property
  const propertyReservations = useMemo(() => {
    return getReservationsForProperty(property.id);
  }, [property.id, getReservationsForProperty]);

  // Constants for reservation bar positioning
  const laneHeight = 24;
  const baseOffset = 4;

  return (
    <React.Fragment>
      <div className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate h-16">
        <div className="flex flex-col">
          <span>{property.name}</span>
          {typeIndicator && (
            <span className="text-xs text-muted-foreground mt-1">
              {typeIndicator}
            </span>
          )}
        </div>
      </div>
      
      {/* Day cells */}
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
          showTooltips={false} // Don't show tooltips in cells since we'll use reservation bars
        />
      ))}
      
      {/* Reservation Bars */}
      <div className="absolute left-[160px] w-[calc(100%-160px)] h-16 pointer-events-none">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${property.id}-${weekIndex}`} className="absolute h-16" style={{ left: `${weekIndex * (100 / weeks.length)}%`, width: `${100 / weeks.length}%` }}>
            {propertyReservations.filter(reservation => {
              return week.some(day => {
                if (!day) return false;
                const normalizedDay = normalizeDate(day);
                return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
              });
            }).map((reservation) => {
              const lane = propertyLanes.get(`${property.id}-${reservation.id}`) || 0;
              const topPosition = baseOffset + (lane * laneHeight);
              
              // Find position in week
              const { startPos, endPos, continuesFromPrevious, continuesToNext } = findReservationPositionInWeek(
                week,
                reservation.startDate,
                reservation.endDate
              );
              
              if (startPos === -1) return null;
              
              // Calculate bar position and style
              const { barLeft, barWidth, borderRadiusStyle } = calculateBarPositionAndStyle(
                startPos,
                endPos,
                continuesFromPrevious,
                continuesToNext,
                week,
                reservation.startDate,
                reservation.endDate
              );
              
              // Determine if this reservation is indirect (from parent or child)
              const isIndirect = 
                (property.type === 'parent' && reservation.propertyId !== property.id) || 
                (property.type === 'child' && reservation.propertyId !== property.id);
              
              const backgroundColor = getReservationStyle(reservation, isIndirect);
              const sourceInfo = getSourceReservationInfo(reservation);
              
              return (
                <div 
                  key={`res-bar-${property.id}-${reservation.id}-${weekIndex}`}
                  className={`absolute h-8 ${backgroundColor} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium text-xs pointer-events-auto cursor-pointer overflow-hidden`}
                  style={{
                    top: `${topPosition}px`,
                    left: barLeft,
                    width: barWidth,
                    minWidth: '30px',
                    zIndex: 20
                  }}
                  title={`${reservation.platform} - ${reservation.guestName || 'Sin nombre'}`}
                >
                  <span className="truncate">{reservation.platform}</span>
                  {isIndirect && <span className="ml-1 text-xs">(Related)</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

export default PropertyRow;
