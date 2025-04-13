
import React from 'react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Property } from '@/types';

interface ReservationTooltipProps {
  reservation: any;
  property: Property;
  sourceInfo: { property?: Property, reservation?: any };
  style: string;
  topPosition: number;
  isCheckInDay?: boolean;
  isCheckOutDay?: boolean;
  zIndex?: number;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({
  reservation,
  property,
  sourceInfo,
  style,
  topPosition,
  isCheckInDay,
  isCheckOutDay,
  zIndex = 10
}) => {
  const isBlock = reservation.status === 'Blocked' || reservation.isBlocking;
  const showSourceInfo = sourceInfo.property && sourceInfo.reservation;
  
  // Calculate width and position based on check-in/check-out status
  let width = '100%';
  let left = '0';
  let right = '0';
  let borderRadius = 'rounded-full';
  
  // Single day reservation (both check-in and check-out)
  if (isCheckInDay && isCheckOutDay) {
    width = '100%';
    borderRadius = 'rounded-full';
  }
  // Check-in day only - start at 60% and go to 100%
  else if (isCheckInDay) {
    width = '40%';
    left = '60%';
    right = 'auto';
    borderRadius = 'rounded-l-full';
  }
  // Check-out day only - start at 0% and go to 30%
  else if (isCheckOutDay) {
    width = '30%';
    left = '0';
    right = 'auto';
    borderRadius = 'rounded-r-full';
  }
  
  // Adjust label position/visibility based on bar width
  const showLabel = !isCheckOutDay || (isCheckInDay && isCheckOutDay);
  
  // Additional styles for multi-day reservations
  let additionalStyles = '';
  
  if (isCheckInDay && !isCheckOutDay) {
    additionalStyles = 'mr-0 border-r-0';
  } else if (!isCheckInDay && isCheckOutDay) {
    additionalStyles = 'ml-0 border-l-0';
  } else if (!isCheckInDay && !isCheckOutDay) {
    additionalStyles = 'mx-0 border-l-0 border-r-0';
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute h-8 ${style} ${borderRadius} ${additionalStyles} flex items-center px-2 text-white text-xs cursor-pointer overflow-hidden`}
            style={{
              top: `${topPosition}px`,
              left,
              right,
              width,
              zIndex
            }}
          >
            {showLabel && (
              <span className="truncate">
                {reservation.platform || 'Blocked'}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Platform:</strong> {reservation.platform || 'N/A'}</p>
            <p><strong>Check-in:</strong> {format(new Date(reservation.startDate), 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(new Date(reservation.endDate), 'MMM d, yyyy')}</p>
            
            {reservation.status && <p><strong>Status:</strong> {reservation.status}</p>}
            {isBlock && <p><strong>Blocked:</strong> Yes</p>}
            {reservation.guestName && <p><strong>Guest:</strong> {reservation.guestName}</p>}
            
            {showSourceInfo && (
              <>
                <div className="border-t my-1 pt-1">
                  <p className="font-medium">Source Reservation:</p>
                  <p><strong>Property:</strong> {sourceInfo.property.name}</p>
                  <p><strong>Platform:</strong> {sourceInfo.reservation.platform}</p>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReservationTooltip;
