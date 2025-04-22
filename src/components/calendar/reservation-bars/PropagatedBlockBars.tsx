
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
  filteredReservations?: Reservation[];
}

const PropagatedBlockBars: React.FC<PropagatedBlockBarsProps> = ({
  weeks,
  propagatedBlocks,
  weekPropagatedBlockLanes,
  laneHeight,
  baseOffset,
  laneGap,
  filteredReservations = []
}) => {
  // Early return if no blocks
  if (!propagatedBlocks || propagatedBlocks.length === 0) return null;
  
  // Function to check if there's an original reservation on a specific date
  const checkForNeighboringReservations = (date: Date, propertyId: string): boolean => {
    // Normalize the date for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);
    
    // Look for any regular reservation that starts or ends on this date for this property
    return filteredReservations.some(res => {
      if (res.propertyId !== propertyId) return false;
      
      const resStartDate = new Date(res.startDate);
      resStartDate.setHours(12, 0, 0, 0);
      
      const resEndDate = new Date(res.endDate);
      resEndDate.setHours(12, 0, 0, 0);
      
      // Check if the reservation starts or ends exactly on this date
      const isStartDateMatch = resStartDate.getTime() === normalizedDate.getTime();
      const isEndDateMatch = resEndDate.getTime() === normalizedDate.getTime();
      
      console.log(`Checking reservation ${res.id} against date ${normalizedDate.toLocaleDateString()}: ` +
                 `Start: ${isStartDateMatch}, End: ${isEndDateMatch}`);
                 
      return isStartDateMatch || isEndDateMatch;
    });
  };
  
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
              
              // Get the lane assignment for this block in this week
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
                  laneGap={laneGap}
                  checkForNeighboringReservations={checkForNeighboringReservations}
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
