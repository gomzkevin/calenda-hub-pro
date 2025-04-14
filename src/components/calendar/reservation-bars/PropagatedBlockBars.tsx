
import React from 'react';
import { Reservation } from '@/types';
import PropagatedBlockBar from '../PropagatedBlockBar';

interface PropagatedBlockBarsProps {
  weeks: (Date | null)[][];
  propagatedBlocks: Reservation[];
  weekPropagatedBlockLanes: Record<number, Record<string, number>>;
  laneHeight: number;
  baseOffset: number;
}

const PropagatedBlockBars: React.FC<PropagatedBlockBarsProps> = ({
  weeks,
  propagatedBlocks,
  weekPropagatedBlockLanes,
  laneHeight,
  baseOffset
}) => {
  // Early return if no blocks
  if (!propagatedBlocks || propagatedBlocks.length === 0) return null;
  
  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`propagated-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {week[0] && propagatedBlocks.map((block) => {
              // Verificamos si el bloque pertenece a esta semana específica
              const startDate = new Date(block.startDate);
              const endDate = new Date(block.endDate);
              
              // Verificar si al menos un día de la semana está entre las fechas del bloque
              const weekHasBlock = week.some(day => {
                if (!day) return false;
                const normalizedDay = new Date(day);
                normalizedDay.setUTCHours(12, 0, 0, 0);
                return normalizedDay <= endDate && normalizedDay >= startDate;
              });
              
              if (!weekHasBlock) return null;
              
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
