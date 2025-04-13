
import React, { useMemo } from 'react';
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
  
  // Sort check-in/check-out reservations to ensure proper rendering order
  // Check-out reservations should be rendered before check-in reservations
  const sortedDayReservations = useMemo(() => {
    return [...dayReservations].sort((a, b) => {
      // First sort by check-in/check-out status for same-day events
      const aIsCheckOut = normalizedDay.getTime() === normalizeDate(new Date(a.endDate)).getTime();
      const bIsCheckOut = normalizedDay.getTime() === normalizeDate(new Date(b.endDate)).getTime();
      
      // Check-out comes before check-in
      if (aIsCheckOut && !bIsCheckOut) return -1;
      if (!aIsCheckOut && bIsCheckOut) return 1;
      
      // Default to original sort
      return sortReservations(a, b);
    });
  }, [dayReservations, normalizedDay, sortReservations]);
  
  let bgColorClass = isToday ? 'bg-blue-50' : '';
  
  if (hasReservation && sortedDayReservations.length === 0) {
    bgColorClass = isIndirect ? 'bg-gray-100' : bgColorClass;
  }
  
  return (
    <div
      className={`border relative min-h-[4rem] h-16 ${bgColorClass}`}
    >
      {hasReservation && isIndirect && sortedDayReservations.length === 0 && (
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
        
        // Determine if it's a check-in or check-out day
        const isCheckInDay = normalizedDay.getTime() === normalizeDate(new Date(res.startDate)).getTime();
        const isCheckOutDay = normalizedDay.getTime() === normalizeDate(new Date(res.endDate)).getTime();
        
        // Only generate clip-path if it's either check-in or check-out (not both)
        let clipPath;
        if (isCheckInDay && !isCheckOutDay) {
          clipPath = 'polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%)';
        } else if (isCheckOutDay && !isCheckInDay) {
          clipPath = 'polygon(0% 0%, 70% 0%, 70% 100%, 0% 100%)';
        }
        
        // Apply different z-index based on reservation type
        let zIndex = 10;
        if (isCheckInDay && isCheckOutDay) zIndex = 30; // Highest for single-day
        else if (isCheckInDay) zIndex = 20; // Higher for check-in
        else if (isCheckOutDay) zIndex = 15; // Medium for check-out
        
        return (
          <ReservationTooltip
            key={`res-${res.id}-${idx}`}
            reservation={res}
            property={property}
            sourceInfo={sourceInfo}
            style={style}
            topPosition={topPosition}
            isStartDay={isCheckInDay}
            clipPath={clipPath}
            zIndex={zIndex}
          />
        );
      })}
    </div>
  );
};

export default DayCell;
