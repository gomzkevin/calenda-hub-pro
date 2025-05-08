
import React, { memo } from 'react';
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

// Added memoization to prevent unnecessary re-renders
const PropagatedBlockBar: React.FC<{
  block: Reservation;
  week: (Date | null)[];
  weekIndex: number;
  lane: number;
  laneHeight: number;
  baseOffset: number;
}> = memo(({
  block,
  week,
  weekIndex,
  lane,
  laneHeight,
  baseOffset
}) => {
  // Find positions in the week
  const { startPos, endPos, continuesFromPrevious, continuesToNext } = findReservationPositionInWeek(
    week,
    block.startDate,
    block.endDate
  );
  
  // If not in this week, don't render
  if (startPos === -1) return null;
  
  // Get bar position, width and style
  const { barLeft, barWidth, borderRadiusStyle } = calculateBarPositionAndStyle(
    startPos,
    endPos,
    continuesFromPrevious,
    continuesToNext,
    week,
    block.startDate,
    block.endDate,
    false, // forceContinuous
    true   // isPropagatedBlock - always true for this component
  );
  
  // Calculate vertical position relative to the week
  const verticalPosition = baseOffset + (lane * laneHeight);
  
  return (
    <TooltipProvider key={`block-${weekIndex}-${block.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-7 bg-gray-300 border border-dashed border-gray-500 ${borderRadiusStyle} flex items-center gap-1 pl-2 text-gray-700 font-medium text-xs pointer-events-auto cursor-pointer overflow-hidden transition-all duration-200 hover:bg-gray-350 hover:shadow-sm hover:scale-[1.02] hover:z-30`}
            style={{
              top: `${verticalPosition}px`,
              left: barLeft,
              width: barWidth,
              minWidth: '30px',
              zIndex: 5
            }}
          >
            <Lock size={12} className="shrink-0" />
            <span className="truncate">Bloqueado</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-lg p-3 z-30">
          <div className="text-xs space-y-1.5">
            <p className="font-semibold text-sm">Bloqueado automáticamente</p>
            <p><strong>Check-in:</strong> {format(block.startDate, 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(block.endDate, 'MMM d, yyyy')}</p>
            {block.sourceReservationId && (
              <p><strong>Bloqueado por reserva en otra propiedad</strong></p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default PropagatedBlockBar;
