
import React from 'react';
import { isSameDay } from 'date-fns';
import { Property } from '@/types';
import ReservationTooltip from './ReservationTooltip';
import { Link } from 'lucide-react';
import { findReservationPositionInWeek } from '../utils/reservationPosition';
import { calculateBarPositionAndStyle } from '../utils/styleCalculation';

interface DayCellProps {
  day: Date;
  property: Property;
  dayIndex: number;
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

const DayCell: React.FC<DayCellProps> = ({
  day,
  property,
  dayIndex,
  getDayReservationStatus,
  sortReservations,
  propertyLanes,
  getReservationStyle,
  getSourceReservationInfo,
  normalizeDate
}) => {
  const isToday = isSameDay(day, new Date());
  const normalizedDay = normalizeDate(day);
  
  const { 
    hasReservation, 
    isIndirect, 
    reservations: dayReservations 
  } = getDayReservationStatus(property, day);
  
  // Sort reservations to display check-outs first, then check-ins
  const sortedDayReservations = [...dayReservations].sort((a, b) => {
    // First check if one is a check-out and the other is a check-in
    const aIsCheckout = isSameDay(normalizeDate(a.endDate), normalizedDay);
    const bIsCheckout = isSameDay(normalizeDate(b.endDate), normalizedDay);
    
    if (aIsCheckout && !bIsCheckout) return -1; // a is checkout, b is not
    if (!aIsCheckout && bIsCheckout) return 1;  // b is checkout, a is not
    
    // If both are the same type, use the standard sort
    return sortReservations(a, b);
  });
  
  let bgColorClass = isToday ? 'bg-blue-50' : '';
  
  // When there's an indirect reservation but no direct tooltip reservations to display
  // (common for parent properties showing indicators for child reservations)
  if (hasReservation && isIndirect && sortedDayReservations.length === 0) {
    bgColorClass = 'bg-gray-100';
  }
  
  return (
    <div
      className={`border relative min-h-[4rem] h-16 ${bgColorClass}`}
    >
      {/* Indicator for indirect reservations without specific tooltips */}
      {hasReservation && isIndirect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
      )}
      
      {sortedDayReservations.map((res, idx) => {
        const lane = propertyLanes.get(`${property.id}-${res.id}`) || 0;
        
        const laneHeight = 24;
        const baseOffset = 4;
        const topPosition = baseOffset + (lane * laneHeight);
        
        const isIndirectReservation = 
          (property.type === 'parent' && res.propertyId !== property.id) || 
          (property.type === 'child' && res.propertyId !== property.id);
        
        const style = getReservationStyle(res, isIndirectReservation);
        
        const sourceInfo = getSourceReservationInfo(res);
        
        // Check if this is a check-in day (reservation starts on this day)
        const isCheckInDay = isSameDay(normalizeDate(res.startDate), normalizedDay);
        
        // Check if this is a check-out day (reservation ends on this day)
        const isCheckOutDay = isSameDay(normalizeDate(res.endDate), normalizedDay);
        
        return (
          <ReservationTooltip
            key={`res-${res.id}-${idx}`}
            reservation={res}
            property={property}
            sourceInfo={sourceInfo}
            style={style}
            topPosition={topPosition}
            isStartDay={isCheckInDay}
            isEndDay={isCheckOutDay}
          />
        );
      })}
    </div>
  );
};

export default DayCell;
