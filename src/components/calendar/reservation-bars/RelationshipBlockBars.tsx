
import React from 'react';
import { Reservation } from '@/types';
import RelationshipBlockBar from '../RelationshipBlockBar';

interface RelationshipBlockBarsProps {
  weeks: (Date | null)[][];
  relationshipBlocks: Reservation[];
  weekRelationshipBlockLanes: Record<number, Record<string, number>>;
  laneHeight: number;
  baseOffset: number;
}

const RelationshipBlockBars: React.FC<RelationshipBlockBarsProps> = ({
  weeks,
  relationshipBlocks,
  weekRelationshipBlockLanes,
  laneHeight,
  baseOffset
}) => {
  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`relationship-week-${weekIndex}`} className="col-span-7 relative">
          {week[0] && relationshipBlocks.filter(block => {
            return week.some(day => {
              if (!day) return false;
              const normalizedDay = new Date(day);
              normalizedDay.setUTCHours(12, 0, 0, 0);
              return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
            });
          }).map((block) => {
            const relationshipLanes = weekRelationshipBlockLanes[weekIndex] || {};
            const lane = relationshipLanes[block.id] || 5;
            
            return (
              <RelationshipBlockBar
                key={`rel-${weekIndex}-${block.id}`}
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
      ))}
    </>
  );
};

export default RelationshipBlockBars;
