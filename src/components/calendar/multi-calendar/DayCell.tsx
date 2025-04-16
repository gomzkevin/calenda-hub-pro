
import React from 'react';
import { isSameDay, addDays, subDays } from 'date-fns';
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
  
  // Get additional info for adjacent days to check for continual occupation
  const prevDay = subDays(day, 1);
  const nextDay = addDays(day, 1);
  const prevDayStatus = getDayReservationStatus(property, prevDay);
  const nextDayStatus = getDayReservationStatus(property, nextDay);
  
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
  
  if (hasReservation && sortedDayReservations.length === 0) {
    bgColorClass = isIndirect ? 'bg-gray-100' : bgColorClass;
  }
  
  // For parent properties, check if we have both check-in and check-out reservations on the same day
  // across different child properties
  let hasSameDayChangeOver = false;
  if (property.type === 'parent') {
    const checkInReservations = sortedDayReservations.filter(res => 
      isSameDay(normalizeDate(res.startDate), normalizedDay) && !isSameDay(normalizeDate(res.endDate), normalizedDay)
    );
    
    const checkOutReservations = sortedDayReservations.filter(res => 
      isSameDay(normalizeDate(res.endDate), normalizedDay) && !isSameDay(normalizeDate(res.startDate), normalizedDay)
    );
    
    hasSameDayChangeOver = checkInReservations.length > 0 && checkOutReservations.length > 0;
  }
  
  // Check for continuous occupation
  const hasContinuousOccupation = property.type === 'parent' && 
    // We have a reservation today
    hasReservation && 
    // And either yesterday or tomorrow has a reservation
    (prevDayStatus.hasReservation || nextDayStatus.hasReservation);
  
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
        
        // Check if this is a check-in day (reservation starts on this day)
        const isCheckInDay = isSameDay(normalizeDate(res.startDate), normalizedDay);
        
        // Check if this is a check-out day (reservation ends on this day)
        const isCheckOutDay = isSameDay(normalizeDate(res.endDate), normalizedDay);
        
        // Special logic for parent properties to visualize continuous occupation
        let forceDisplayAsMiddle = false;
        
        if (property.type === 'parent') {
          // If this is a checkout day or a checkin day and adjacent days are occupied
          if (hasContinuousOccupation) {
            // For checkout days with next day occupied - force mid-segment display
            if (isCheckOutDay && nextDayStatus.hasReservation) {
              forceDisplayAsMiddle = true;
            }
            
            // For checkin days with previous day occupied - force mid-segment display
            if (isCheckInDay && prevDayStatus.hasReservation) {
              forceDisplayAsMiddle = true;
            }
            
            // If we have both check-in and check-out on the same day in different child properties
            if (hasSameDayChangeOver) {
              forceDisplayAsMiddle = true;
            }
          }
        }
        
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
            forceDisplayAsMiddle={forceDisplayAsMiddle}
          />
        );
      })}
    </div>
  );
};

export default DayCell;
