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
      {weeks.map((week, weekIndex) => {
        // Skip empty weeks
        if (!week[0]) return null;
        
        // Get blocks that are visible in this week
        const weekBlocks = propagatedBlocks.filter(block => {
          // Only keep blocks that overlap with this week
          return week.some(day => {
            if (!day) return false;
            const normalizedDay = new Date(day);
            normalizedDay.setUTCHours(12, 0, 0, 0);
            return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
          });
        });
        
        return (
          <div 
            key={`propagated-week-${weekIndex}`} 
            className="grid grid-cols-7 w-full absolute" 
            style={{ top: `${weekIndex * 100}px`, height: '100px' }}
          >
            <div className="col-span-7 relative h-full w-full">
              {weekBlocks.map((block) => {
                // Always use lane 0 in our simplified approach
                const lane = 0;
                
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
        );
      })}
    </>
  );
};

export default PropagatedBlockBars;
