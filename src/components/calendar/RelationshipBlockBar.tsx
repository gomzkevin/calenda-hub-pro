
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
import { findReservationPositionInWeek, calculateBarPositionAndStyle } from './utils/calendarUtils';

interface RelationshipBlockBarProps {
  block: Reservation;
  week: (Date | null)[];
  weekIndex: number;
  lane: number;
  laneHeight: number;
  baseOffset: number;
}

const RelationshipBlockBar: React.FC<RelationshipBlockBarProps> = ({
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
    block.endDate
  );
  
  // Calculate vertical position
  const verticalPosition = baseOffset - (lane * laneHeight);
  
  return (
    <TooltipProvider key={`rel-${weekIndex}-${block.id}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-7 bg-amber-400 ${borderRadiusStyle} flex items-center gap-1 pl-2 text-white font-medium text-xs z-10 transition-all hover:brightness-90 hover:shadow-md`}
            style={{
              top: `${verticalPosition}px`,
              left: barLeft,
              width: barWidth,
              minWidth: '40px'
            }}
          >
            <Lock size={12} />
            <span>Bloqueado</span>
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
