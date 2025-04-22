
import React from 'react';
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
  laneGap: number;
  forceContinuous?: boolean;
  checkForNeighboringBlocks?: (date: Date, propertyId: string) => boolean;
}

const ReservationBar: React.FC<ReservationBarProps> = ({
  reservation,
  week,
  weekIndex,
  lane,
  laneHeight,
  baseOffset,
  laneGap,
  forceContinuous = false,
  checkForNeighboringBlocks
}) => {
  // Ensure dates are properly parsed and normalized
  const startDate = normalizeDate(new Date(reservation.startDate));
  const endDate = normalizeDate(new Date(reservation.endDate));
  
  console.log(`==== Processing reservation ${reservation.id} ====`);
  console.log(`Reservation dates: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  console.log(`Week dates: ${week[0]?.toLocaleDateString() || 'null'} to ${week[6]?.toLocaleDateString() || 'null'}`);
  
  // Find positions in the week
  const { startPos, endPos, continuesFromPrevious, continuesToNext } = findReservationPositionInWeek(
    week,
    startDate,
    endDate
  );
  
  // If not in this week, don't render
  if (startPos === -1) {
    console.log(`Reservation not in week ${weekIndex} - skipping render`);
    return null;
  }
  
  // Check for neighboring blocks at start and end dates
  const neighboringReservation = {
    hasNeighborStart: false,
    hasNeighborEnd: false
  };
  
  if (checkForNeighboringBlocks) {
    // Check for neighboring blocks at the start date
    if (startPos >= 0 && week[startPos]) {
      neighboringReservation.hasNeighborStart = checkForNeighboringBlocks(
        startDate, 
        reservation.propertyId
      );
      console.log(`Checked for neighbor at start (${startDate.toLocaleDateString()}): ${neighboringReservation.hasNeighborStart}`);
    }
    
    // Check for neighboring blocks at the end date
    if (endPos >= 0 && endPos < week.length && week[endPos]) {
      neighboringReservation.hasNeighborEnd = checkForNeighboringBlocks(
        endDate,
        reservation.propertyId
      );
      console.log(`Checked for neighbor at end (${endDate.toLocaleDateString()}): ${neighboringReservation.hasNeighborEnd}`);
    }
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
    neighboringReservation
  );
  
  // Calculate vertical position relative to the week
  const verticalPosition = baseOffset + (lane * (laneHeight + laneGap));
  
  // Determine text size based on bar width - smaller text for short reservations
  const isShortReservation = (endPos - startPos) < 1;
  
  // Determine the label to display
  let displayLabel = reservation.platform === 'Other' ? 'Manual' : reservation.platform;
  
  return (
    <TooltipProvider key={`res-${weekIndex}-${reservation.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium ${isShortReservation ? 'text-xs' : 'text-sm'} pointer-events-auto cursor-pointer overflow-hidden`}
            style={{
              top: `${verticalPosition}px`,
              left: barLeft,
              width: barWidth,
              minWidth: '30px',
              zIndex: 20
            }}
          >
            <span className="truncate">{displayLabel}</span>
            {reservation.isBlocking && <span className="ml-1 text-xs">(Block)</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p><strong>Platform:</strong> {reservation.platform === 'Other' ? 'Manual' : reservation.platform}</p>
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
};

export default ReservationBar;
