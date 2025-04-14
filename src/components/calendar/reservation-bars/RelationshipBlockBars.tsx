
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
            {relationshipBlocks.map((block) => {
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
