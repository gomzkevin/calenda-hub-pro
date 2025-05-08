
import React, { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { Property, Reservation } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { normalizeDate } from '../utils/dateUtils';

interface ReservationTooltipProps {
  reservation: Reservation;
  property: Property;
  sourceInfo: { property?: Property; reservation?: Reservation };
  style: string;
  topPosition: number;
  isStartDay: boolean;
  isEndDay: boolean;
  forceDisplayAsMiddle?: boolean;
}

// Added memoization to prevent unnecessary re-renders
const ReservationTooltip: React.FC<ReservationTooltipProps> = memo(({
  reservation,
  property,
  sourceInfo,
  style,
  topPosition,
  isStartDay,
  isEndDay,
  forceDisplayAsMiddle = false
}) => {
  // Ensure dates are properly normalized for display
  const startDate = normalizeDate(new Date(reservation.startDate));
  const endDate = normalizeDate(new Date(reservation.endDate));
  
  // Determine the background color/styling class
  const bgClass = style || 'bg-gray-500';
  
  // Calculate positioning based on day type - now memoized
  const positionStyle = useMemo(() => {
    let style: React.CSSProperties = {
      top: `${topPosition}px`,
      height: '20px'
    };
    
    // Special case for parent properties with continuous occupation
    if (forceDisplayAsMiddle) {
      return {
        ...style,
        left: '0',
        width: '100%',
        borderRadius: '0' // No rounding
      };
    } 
    
    if (isEndDay && !isStartDay) {
      return {
        ...style,
        left: '0',
        width: '43%',
        borderRadius: '0 9999px 9999px 0' // Rounded on right side
      };
    } 
    
    if (isStartDay && !isEndDay) {
      return {
        ...style,
        left: '57%',
        width: '43%',
        borderRadius: '9999px 0 0 9999px' // Rounded on left side
      };
    } 
    
    if (isStartDay && isEndDay) {
      return {
        ...style,
        left: '25%',
        width: '50%',
        borderRadius: '9999px' // Fully rounded
      };
    }
    
    // Default: middle of stay
    return {
      ...style,
      left: '0',
      width: '100%',
      borderRadius: '0' // No rounding
    };
  }, [topPosition, isStartDay, isEndDay, forceDisplayAsMiddle]);
  
  // Display status if it's a blocked reservation
  const isBlocked = reservation.status === 'Blocked';
  const displayLabel = 
    isBlocked ? 'Blocked' : 
    reservation.platform === 'Other' ? 'Manual' : reservation.platform;

  // Create tooltip content
  const tooltipContent = (
    <div className="text-xs space-y-1.5">
      <p className="font-semibold text-sm">{reservation.platform === 'Other' ? 'Manual' : reservation.platform}</p>
      <p><strong>Check-in:</strong> {format(startDate, 'MMM d, yyyy')}</p>
      <p><strong>Check-out:</strong> {format(endDate, 'MMM d, yyyy')}</p>
      {reservation.status && <p><strong>Status:</strong> {reservation.status}</p>}
      {sourceInfo.property && (
        <p><strong>Source Property:</strong> {sourceInfo.property.name}</p>
      )}
      {reservation.guestName && <p><strong>Guest:</strong> {reservation.guestName}</p>}
    </div>
  );

  // Only show tooltip for check-in days (including single-day reservations)
  // or when forced to display as middle
  if (isStartDay || forceDisplayAsMiddle) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`absolute flex items-center justify-center text-white text-xs font-medium cursor-pointer ${bgClass} shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-95 hover:scale-[1.02]`}
              style={positionStyle}
            >
              <span className="truncate px-1">{forceDisplayAsMiddle ? '' : displayLabel}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-lg p-3 z-50">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    // For non-check-in days, just render the bar without a label
    return (
      <div 
        className={`absolute flex items-center justify-center text-white text-xs font-medium ${bgClass} shadow-sm`}
        style={positionStyle}
      >
        <span className="truncate px-1"></span>
      </div>
    );
  }
});

export default ReservationTooltip;
