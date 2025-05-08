
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
  const cellHeight = 120;       // Fixed cell height
  const laneHeight = 32;        // Height between each lane
  const laneGap = 0;            // No gap between different types of lanes for better alignment
  
  // Calculate base offset to center the first reservation in the cell
  const calculateBaseOffset = (maxLanes: number, laneIndex: number) => {
    // Center the bars vertically within the cell
    return (cellHeight - (maxLanes * laneHeight)) / 2 + (laneIndex * laneHeight);
  };
  
  // Calculate the maximum number of lanes for each type
  const maxReservationLanes = Math.max(
    ...Object.values(weekReservationLanes).map(lanes => 
      Object.values(lanes).length > 0 ? Math.max(...Object.values(lanes)) + 1 : 1
    )
  );
  
  const maxRelationshipLanes = relationshipBlocks && relationshipBlocks.length > 0 ? 
    Math.max(
      ...Object.values(weekRelationshipBlockLanes).map(lanes => 
        Object.values(lanes).length > 0 ? Math.max(...Object.values(lanes)) + 1 : 0
      )
    ) : 0;
  
  const maxPropagatedLanes = propagatedBlocks && propagatedBlocks.length > 0 ? 
    Math.max(
      ...Object.values(weekPropagatedBlockLanes).map(lanes => 
        Object.values(lanes).length > 0 ? Math.max(...Object.values(lanes)) + 1 : 0
      )
    ) : 0;
  
  // Calculate base offsets for each type of reservation
  const regularBaseOffset = calculateBaseOffset(maxReservationLanes, 0);
  const relationshipBaseOffset = calculateBaseOffset(maxRelationshipLanes, maxReservationLanes);
  const propagatedBaseOffset = calculateBaseOffset(maxPropagatedLanes, maxReservationLanes + maxRelationshipLanes);
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Regular Reservation bars - HIGHEST PRIORITY */}
      <RegularReservationBars
        weeks={weeks}
        filteredReservations={filteredReservations}
        weekReservationLanes={weekReservationLanes}
        laneHeight={laneHeight}
        baseOffset={regularBaseOffset}
        laneGap={laneGap}
        cellHeight={cellHeight}
      />
      
      {/* Relationship Block Bars (parent-child blocks) - MEDIUM PRIORITY */}
      {relationshipBlocks && relationshipBlocks.length > 0 && (
        <RelationshipBlockBars
          weeks={weeks}
          relationshipBlocks={relationshipBlocks}
          weekRelationshipBlockLanes={weekRelationshipBlockLanes}
          laneHeight={laneHeight}
          baseOffset={relationshipBaseOffset}
          laneGap={laneGap}
        />
      )}
      
      {/* Propagated Block Bars - LOWEST PRIORITY */}
      {propagatedBlocks && propagatedBlocks.length > 0 && (
        <PropagatedBlockBars
          weeks={weeks}
          propagatedBlocks={propagatedBlocks}
          weekPropagatedBlockLanes={weekPropagatedBlockLanes}
          laneHeight={laneHeight}
          baseOffset={propagatedBaseOffset}
          laneGap={laneGap}
        />
      )}
    </div>
  );
};

export default ReservationBars;
