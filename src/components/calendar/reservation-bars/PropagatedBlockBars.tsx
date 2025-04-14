
import React from 'react';
import { Reservation } from '@/types';
import PropagatedBlockBar from '../PropagatedBlockBar';
import { normalizeDate } from '../utils/dateUtils';

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
            {week[0] && propagatedBlocks.filter(block => {
              return week.some(day => {
                if (!day) return false;
                const normalizedDay = normalizeDate(day);
                return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
              });
            }).map((block) => {
              // Get lane assignment for this block in this week
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
