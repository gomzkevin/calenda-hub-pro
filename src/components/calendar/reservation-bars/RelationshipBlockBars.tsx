
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
  // Early return if no blocks
  if (!relationshipBlocks || relationshipBlocks.length === 0) return null;
  
  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`relationship-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {week[0] && relationshipBlocks.map((block) => {
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
              const lane = weekRelationshipBlockLanes[weekIndex]?.[block.id] || 0;
              
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
        </div>
      ))}
    </>
  );
};

export default RelationshipBlockBars;
