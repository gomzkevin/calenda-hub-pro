
import React from 'react';
import { isSameDay } from 'date-fns';
import { Property } from '@/types';
import ReservationTooltip from './ReservationTooltip';
import { Link } from 'lucide-react';

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
  
  const sortedDayReservations = [...dayReservations].sort(sortReservations);
  
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
      
      {sortedDayReservations.map((res) => {
        const isStartDay = isSameDay(normalizeDate(res.startDate), normalizedDay);
        const isEndDay = isSameDay(normalizeDate(res.endDate), normalizedDay);
        const isSingleDay = isStartDay && isEndDay;
        
        const lane = propertyLanes.get(`${property.id}-${res.id}`) || 0;
        
        const laneHeight = 24;
        const baseOffset = 4;
        const topPosition = baseOffset + (lane * laneHeight);
        
        const leftValue = isStartDay ? '60%' : '0%';
        const rightValue = isEndDay ? '60%' : '0%';
        const borderRadius = isSingleDay
          ? 'rounded-full'
          : isStartDay
            ? 'rounded-l-full'
            : isEndDay
              ? 'rounded-r-full'
              : '';
        
        const isIndirectReservation = 
          (property.type === 'parent' && res.propertyId !== property.id) || 
          (property.type === 'child' && res.propertyId !== property.id);
        
        const style = getReservationStyle(res, isIndirectReservation);
        
        const sourceInfo = getSourceReservationInfo(res);
        
        return (
          <ReservationTooltip
            key={`res-${res.id}-${dayIndex}`}
            reservation={res}
            property={property}
            sourceInfo={sourceInfo}
            style={style}
            borderRadius={borderRadius}
            topPosition={topPosition}
            leftValue={leftValue}
            rightValue={rightValue}
            isStartDay={isStartDay}
          />
        );
      })}
    </div>
  );
};

export default DayCell;
