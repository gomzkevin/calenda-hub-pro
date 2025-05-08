
import React from 'react';
import { Reservation } from '@/types';
import RegularReservationBars from './reservation-bars/RegularReservationBars';
import RelationshipBlockBars from './reservation-bars/RelationshipBlockBars';
import PropagatedBlockBars from './reservation-bars/PropagatedBlockBars';

interface ReservationBarsProps {
  weeks: (Date | null)[][];
  filteredReservations: Reservation[];
  relationshipBlocks: Reservation[] | undefined;
  propagatedBlocks: Reservation[] | undefined;
  weekReservationLanes: Record<number, Record<string, number>>;
  weekRelationshipBlockLanes: Record<number, Record<string, number>>;
  weekPropagatedBlockLanes: Record<number, Record<string, number>>;
}

const ReservationBars: React.FC<ReservationBarsProps> = ({
  weeks,
  filteredReservations,
  relationshipBlocks,
  propagatedBlocks,
  weekReservationLanes,
  weekRelationshipBlockLanes,
  weekPropagatedBlockLanes
}) => {
  // Constants for better visual presentation
  const cellHeight = 120;  // Fixed cell height
  const barHeight = 28;    // Height of each reservation bar
  
  // Calculate vertical center position in the cell
  const calculateVerticalCenter = (cellHeight: number, barHeight: number) => {
    return (cellHeight - barHeight) / 2;
  };
  
  // Base vertical position (centered in cell)
  const baseVerticalPosition = calculateVerticalCenter(cellHeight, barHeight);
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Regular Reservation bars */}
      <RegularReservationBars
        weeks={weeks}
        filteredReservations={filteredReservations}
        weekReservationLanes={weekReservationLanes}
        barHeight={barHeight}
        baseVerticalPosition={baseVerticalPosition}
        cellHeight={cellHeight}
      />
      
      {/* Relationship Block Bars (parent-child blocks) */}
      {relationshipBlocks && relationshipBlocks.length > 0 && (
        <RelationshipBlockBars
          weeks={weeks}
          relationshipBlocks={relationshipBlocks}
          weekRelationshipBlockLanes={weekRelationshipBlockLanes}
          laneHeight={barHeight}
          baseOffset={baseVerticalPosition}
          laneGap={0}
        />
      )}
      
      {/* Propagated Block Bars */}
      {propagatedBlocks && propagatedBlocks.length > 0 && (
        <PropagatedBlockBars
          weeks={weeks}
          propagatedBlocks={propagatedBlocks}
          weekPropagatedBlockLanes={weekPropagatedBlockLanes}
          laneHeight={barHeight}
          baseOffset={baseVerticalPosition}
          laneGap={0}
        />
      )}
    </div>
  );
};

export default ReservationBars;
