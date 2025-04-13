
import React from 'react';
import { format } from 'date-fns';
import { Property, Reservation } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ReservationTooltipProps {
  reservation: Reservation;
  property: Property;
  sourceInfo: { property?: Property; reservation?: Reservation };
  style: string;
  topPosition: number;
  isStartDay: boolean;
  isEndDay: boolean;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({
  reservation,
  property,
  sourceInfo,
  style,
  topPosition,
  isStartDay,
  isEndDay
}) => {
  // Determine the background color/styling class
  const bgClass = style || 'bg-gray-500';
  
  // Determine positioning based on if it's a check-in or check-out day
  let positionStyle: React.CSSProperties = {
    top: `${topPosition}px`,
    height: '20px'
  };
  
  if (isEndDay && !isStartDay) {
    // Check-out only - position at the left edge, full width
    positionStyle = {
      ...positionStyle,
      left: '0',
      width: '43%',
      borderRadius: '0 9999px 9999px 0' // Rounded on right side
    };
  } else if (isStartDay && !isEndDay) {
    // Check-in only - position at the right edge, full width
    positionStyle = {
      ...positionStyle,
      left: '57%',
      width: '43%',
      borderRadius: '9999px 0 0 9999px' // Rounded on left side
    };
  } else if (isStartDay && isEndDay) {
    // Both check-in and check-out (1-day stay)
    positionStyle = {
      ...positionStyle,
      left: '25%',
      width: '50%',
      borderRadius: '9999px' // Fully rounded
    };
  } else {
    // Middle of a stay
    positionStyle = {
      ...positionStyle,
      left: '0',
      width: '100%',
      borderRadius: '0' // No rounding
    };
  }
  
  // Display status if it's a blocked reservation
  const isBlocked = reservation.status === 'Blocked';
  const displayLabel = 
    isBlocked ? 'Blocked' : 
    reservation.platform;

  // Create tooltip content
  let tooltipContent = (
    <div className="text-xs space-y-1">
      <p><strong>Platform:</strong> {reservation.platform}</p>
      <p><strong>Check-in:</strong> {format(reservation.startDate, 'MMM d, yyyy')}</p>
      <p><strong>Check-out:</strong> {format(reservation.endDate, 'MMM d, yyyy')}</p>
      {reservation.status && <p><strong>Status:</strong> {reservation.status}</p>}
      {sourceInfo.property && (
        <p><strong>Source Property:</strong> {sourceInfo.property.name}</p>
      )}
      {reservation.guestName && <p><strong>Guest:</strong> {reservation.guestName}</p>}
    </div>
  );

  // Only show tooltip for check-in days (including single-day reservations)
  if (isStartDay) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`absolute flex items-center justify-center text-white text-xs font-medium cursor-pointer ${bgClass}`}
              style={positionStyle}
            >
              <span className="truncate px-1">{displayLabel}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    // For non-check-in days, just render the bar without a tooltip
    return (
      <div 
        className={`absolute flex items-center justify-center text-white text-xs font-medium ${bgClass}`}
        style={positionStyle}
      >
        <span className="truncate px-1">{displayLabel}</span>
      </div>
    );
  }
};

export default ReservationTooltip;
