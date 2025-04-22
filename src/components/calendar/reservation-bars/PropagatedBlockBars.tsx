
import React from 'react';
import { Reservation } from '@/types';
import PropagatedBlockBar from '../PropagatedBlockBar';

interface PropagatedBlockBarsProps {
  weeks: (Date | null)[][];
  propagatedBlocks: Reservation[];
  weekPropagatedBlockLanes: Record<number, Record<string, number>>;
  laneHeight: number;
  baseOffset: number;
  laneGap: number;
}

const PropagatedBlockBars: React.FC<PropagatedBlockBarsProps> = ({
  weeks,
  propagatedBlocks,
  weekPropagatedBlockLanes,
  laneHeight,
  baseOffset,
  laneGap
}) => {
  // Early return if no blocks
  if (!propagatedBlocks || propagatedBlocks.length === 0) return null;
  
  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`propagated-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {propagatedBlocks.map((block) => {
              // Verificar si el bloque intersecta con esta semana
              const startDate = new Date(block.startDate);
              const endDate = new Date(block.endDate);
              
              // Verificar si la semana intersecta con el bloque
              const weekStart = week.find(day => day !== null);
              const weekEnd = [...week].reverse().find(day => day !== null);
              
              if (!weekStart || !weekEnd) return null;
              
              // Normalizar fechas para comparación
              const normalizedWeekStart = new Date(weekStart);
              normalizedWeekStart.setHours(12, 0, 0, 0);
              
              const normalizedWeekEnd = new Date(weekEnd);
              normalizedWeekEnd.setHours(12, 0, 0, 0);
              
              const normalizedStartDate = new Date(startDate);
              normalizedStartDate.setHours(12, 0, 0, 0);
              
              const normalizedEndDate = new Date(endDate);
              normalizedEndDate.setHours(12, 0, 0, 0);
              
              // Comprobar si hay intersección
              const blockStartsBeforeWeekEnds = normalizedStartDate <= normalizedWeekEnd;
              const blockEndsAfterWeekStarts = normalizedEndDate >= normalizedWeekStart;
              
              const hasIntersection = blockStartsBeforeWeekEnds && blockEndsAfterWeekStarts;
              
              if (!hasIntersection) return null;
              
              // Always use lane 0 in our simplified approach
              const lane = weekPropagatedBlockLanes[weekIndex]?.[block.id] || 0;
              
              return (
                <PropagatedBlockBar
                  key={`block-${weekIndex}-${block.id}`}
                  block={block}
                  week={week}
                  weekIndex={weekIndex}
                  lane={lane}
                  laneHeight={laneHeight}
                  baseOffset={baseOffset}
                />
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
};

export default PropagatedBlockBars;
