
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
const RelationshipBlockBar: React.FC<{
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
    false,  // forceContinuous
    false,  // isPropagatedBlock
    true    // isOriginalBlock - always true for this component
  );
  
  // Calculate vertical position relative to the week
  const verticalPosition = baseOffset + (lane * laneHeight);
  
  return (
    <TooltipProvider key={`rel-${weekIndex}-${block.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-7 bg-amber-400 shadow-sm ${borderRadiusStyle} flex items-center gap-1 pl-2 text-white font-medium text-xs pointer-events-auto cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md hover:brightness-95 hover:scale-[1.02] hover:z-30`}
            style={{
              top: `${verticalPosition}px`,
              left: barLeft,
              width: barWidth,
              minWidth: '30px',
              zIndex: 10
            }}
          >
            <Lock size={12} className="shrink-0" />
            <span className="truncate">Bloqueado</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-lg p-3 z-40">
          <div className="text-xs space-y-1.5">
            <p className="font-semibold text-sm">Bloqueado automáticamente</p>
            <p><strong>Reserva en {block.platform}</strong></p>
            <p><strong>Check-in:</strong> {format(block.startDate, 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(block.endDate, 'MMM d, yyyy')}</p>
            <p>
              <strong>
                {block.guestName ? 
                  `Reserva de ${block.guestName}` : 
                  "Bloqueado por reserva en otra propiedad"}
              </strong>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default RelationshipBlockBar;
