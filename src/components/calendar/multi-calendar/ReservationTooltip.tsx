
import React from 'react';
import { format, differenceInCalendarDays, isValid } from 'date-fns';
import { Property } from '@/types';

interface ReservationTooltipProps {
  reservation: any;
  property: Property;
  sourceInfo: { property?: Property; reservation?: any };
  style: string;
  topPosition: number;
  isStartDay: boolean;
  isEndDay: boolean;
  forceDisplayAsMiddle?: boolean;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({
  reservation,
  property,
  sourceInfo,
  style,
  topPosition,
  isStartDay,
  isEndDay,
  forceDisplayAsMiddle = false
}) => {
  // Validación segura de fechas
  const startDate = new Date(reservation.startDate);
  const endDate = new Date(reservation.endDate);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    console.error("Invalid dates in reservation", { 
      id: reservation.id, 
      startDate: reservation.startDate,
      endDate: reservation.endDate
    });
    return null;
  }

  const nights = differenceInCalendarDays(endDate, startDate);
  const isBlocked = reservation.status === 'Blocked' || reservation.notes === 'Blocked';
  
  let borderRadius = '';
  if (forceDisplayAsMiddle) {
    borderRadius = 'rounded-none';
  } else if (isStartDay && isEndDay) {
    borderRadius = 'rounded-full';
  } else if (isStartDay) {
    borderRadius = 'rounded-l-md';
  } else if (isEndDay) {
    borderRadius = 'rounded-r-md';
  } else {
    borderRadius = 'rounded-none';
  }

  return (
    <div 
      className={`absolute z-20 h-6 ${style} ${borderRadius} flex items-center overflow-hidden`}
      style={{ top: `${topPosition}px`, left: 0, right: 0 }}
    >
      <div className="px-1 truncate text-xs">
        {!isBlocked && (
          <span className="font-medium">
            {reservation.guestName || 'Sin nombre'}
          </span>
        )}
        {isBlocked && (
          <span className="font-medium">
            {sourceInfo.property ? `Bloqueado por ${sourceInfo.property.name}` : 'Bloqueado'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReservationTooltip;
