
import React from 'react';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';
import { Reservation } from '@/types';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { findReservationPositionInWeek } from './utils/reservationPosition';
import { calculateBarPositionAndStyle } from './utils/styleCalculation';
import { normalizeDate } from './utils/dateUtils';

interface PropagatedBlockBarProps {
  block: Reservation;
  week: (Date | null)[];
  weekIndex: number;
  lane: number;
  laneHeight: number;
  baseOffset: number;
  laneGap: number;
  checkForNeighboringReservations?: (date: Date, propertyId: string) => boolean;
}

const PropagatedBlockBar: React.FC<PropagatedBlockBarProps> = ({
  block,
  week,
  weekIndex,
  lane,
  laneHeight,
  baseOffset,
  laneGap,
  checkForNeighboringReservations
}) => {
  // Find positions in the week
  const { startPos, endPos, continuesFromPrevious, continuesToNext } = findReservationPositionInWeek(
    week,
    block.startDate,
    block.endDate
  );
  
  // If not in this week, don't render
  if (startPos === -1) return null;
  
  // Normalize dates for better comparison
  const normalizedStartDate = normalizeDate(new Date(block.startDate));
  const normalizedEndDate = normalizeDate(new Date(block.endDate));
  
  // Check for neighboring reservations at start and end dates
  const neighboringReservation = {
    hasNeighborStart: false,
    hasNeighborEnd: false
  };
  
  if (checkForNeighboringReservations) {
    // Check for neighboring reservation at the start date
    if (startPos >= 0 && week[startPos]) {
      neighboringReservation.hasNeighborStart = checkForNeighboringReservations(
        normalizedStartDate, 
        block.propertyId
      );
    }
    
    // Check for neighboring reservation at the end date
    if (endPos >= 0 && endPos < week.length && week[endPos]) {
      neighboringReservation.hasNeighborEnd = checkForNeighboringReservations(
        normalizedEndDate,
        block.propertyId
      );
    }
    
    console.log(`Block ${block.id} has neighboring reservations:`, 
                `Start: ${neighboringReservation.hasNeighborStart}`, 
                `End: ${neighboringReservation.hasNeighborEnd}`);
  }
  
  // Get bar position, width and style
  const { barLeft, barWidth, borderRadiusStyle } = calculateBarPositionAndStyle(
    startPos,
    endPos,
    continuesFromPrevious,
    continuesToNext,
    week,
    normalizedStartDate,
    normalizedEndDate,
    false, // Don't force continuous
    neighboringReservation
  );
  
  // Calculate vertical position relative to the week
  const verticalPosition = baseOffset + (lane * (laneHeight + laneGap));
  
  return (
    <TooltipProvider key={`block-${weekIndex}-${block.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-7 bg-gray-300 border border-dashed border-gray-500 ${borderRadiusStyle} flex items-center gap-1 pl-2 text-gray-700 font-medium text-xs z-10 pointer-events-auto cursor-pointer overflow-hidden`}
            style={{
              top: `${verticalPosition}px`,
              left: barLeft,
              width: barWidth,
              minWidth: '30px'
            }}
          >
            <Lock size={12} className="shrink-0" />
            <span className="truncate">Bloqueado</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p><strong>Bloqueado automáticamente</strong></p>
            <p><strong>Check-in:</strong> {format(normalizedStartDate, 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(normalizedEndDate, 'MMM d, yyyy')}</p>
            {block.sourceReservationId && (
              <p><strong>Bloqueado por reserva en otra propiedad</strong></p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PropagatedBlockBar;
