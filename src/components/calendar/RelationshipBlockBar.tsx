
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

interface RelationshipBlockBarProps {
  block: Reservation;
  week: (Date | null)[];
  weekIndex: number;
  lane: number;
  laneHeight: number;
  baseOffset: number;
  adjacencyMap?: Record<string, any>;
}

const RelationshipBlockBar: React.FC<RelationshipBlockBarProps> = ({
  block,
  week,
  weekIndex,
  lane,
  laneHeight,
  baseOffset,
  adjacencyMap = {}
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
    false, // Not forcing continuous
    block.id,
    adjacencyMap
  );
  
  // Calculate vertical position relative to the week
  const verticalPosition = baseOffset + (lane * laneHeight);
  
  return (
    <TooltipProvider key={`rel-${weekIndex}-${block.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-7 bg-amber-400 ${borderRadiusStyle} flex items-center gap-1 pl-2 text-white font-medium text-xs z-10 pointer-events-auto cursor-pointer overflow-hidden`}
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
};

export default RelationshipBlockBar;
