
import React, { memo } from 'react';
import { format } from 'date-fns';
import { Reservation } from '@/types';
import { getPlatformColorClass } from '@/data/mockData';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { findReservationPositionInWeek } from './utils/reservationPosition';
import { calculateBarPositionAndStyle } from './utils/styleCalculation';
import { normalizeDate } from './utils/dateUtils';

interface ReservationBarProps {
  reservation: Reservation;
  week: (Date | null)[];
  weekIndex: number;
  lane: number;
  laneHeight: number;
  baseOffset: number;
  forceContinuous?: boolean;
}

// Added memoization to prevent unnecessary re-renders
const ReservationBar: React.FC<ReservationBarProps> = memo(({
  reservation,
  week,
  weekIndex,
  lane,
  laneHeight,
  baseOffset,
  forceContinuous = false
}) => {
  // Ensure dates are properly parsed and normalized
  const startDate = normalizeDate(new Date(reservation.startDate));
  const endDate = normalizeDate(new Date(reservation.endDate));
  
  // Find positions in the week
  const { startPos, endPos, continuesFromPrevious, continuesToNext } = findReservationPositionInWeek(
    week,
    startDate,
    endDate
  );
  
  // If not in this week, don't render
  if (startPos === -1) {
    return null;
  }
  
  // Get bar position, width and style
  const { barLeft, barWidth, borderRadiusStyle } = calculateBarPositionAndStyle(
    startPos,
    endPos,
    continuesFromPrevious,
    continuesToNext,
    week,
    startDate,
    endDate,
    forceContinuous,
    false, // isPropagatedBlock
    false  // isOriginalBlock 
  );
  
  // Calculate vertical position - centered in the cell
  const verticalPosition = baseOffset + (lane * laneHeight);
  
  // Determine text size based on bar width - smaller text for short reservations
  const isShortReservation = (endPos - startPos) < 1;
  
  // Determine the label to display
  let displayLabel = reservation.platform === 'Other' ? 'Manual' : reservation.platform;
  
  return (
    <TooltipProvider key={`res-${weekIndex}-${reservation.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium ${isShortReservation ? 'text-xs' : 'text-sm'} pointer-events-auto cursor-pointer overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-95 hover:scale-[1.02] hover:z-30`}
            style={{
              top: `${verticalPosition}px`,
              left: barLeft,
              width: barWidth,
              minWidth: '30px',
              zIndex: 15
            }}
          >
            <span className="truncate">{displayLabel}</span>
            {reservation.isBlocking && <span className="ml-1 text-xs">(Block)</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-lg p-3 z-50">
          <div className="text-xs space-y-1.5">
            <p className="font-semibold text-sm">{reservation.platform === 'Other' ? 'Manual' : reservation.platform}</p>
            <p><strong>Check-in:</strong> {format(startDate, 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(endDate, 'MMM d, yyyy')}</p>
            {reservation.status && <p><strong>Status:</strong> {reservation.status}</p>}
            {reservation.isBlocking && <p><strong>Blocking:</strong> Yes</p>}
            {reservation.guestName && <p><strong>Guest:</strong> {reservation.guestName}</p>}
            {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default ReservationBar;
