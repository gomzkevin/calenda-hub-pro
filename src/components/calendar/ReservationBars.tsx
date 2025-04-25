
import React, { useMemo } from 'react';
import { Reservation } from '@/types';
import RegularReservationBars from './reservation-bars/RegularReservationBars';
import RelationshipBlockBars from './reservation-bars/RelationshipBlockBars';
import PropagatedBlockBars from './reservation-bars/PropagatedBlockBars';
import { findAdjacentReservations } from './utils/reservationPosition';

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
  // Adjusted constants for better vertical spacing and visual separation
  const laneHeight = 26; // Height for each lane
  const baseOffset = 28; // Base offset from the top
  const laneGap = 2;    // Gap between different types of lanes
  
  // Calculate adjacency information between all reservation types
  const adjacencyMap = useMemo(() => {
    // Combine all reservations and blocks for adjacency detection
    const allItems = [
      ...(filteredReservations || []).map(r => ({ ...r, type: 'regular' })),
      ...(relationshipBlocks || []).map(r => ({ ...r, type: 'relationship' })),
      ...(propagatedBlocks || []).map(r => ({ ...r, type: 'propagated' }))
    ];
    
    return findAdjacentReservations(allItems);
  }, [filteredReservations, relationshipBlocks, propagatedBlocks]);
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Regular Reservation bars - HIGHEST PRIORITY */}
      <RegularReservationBars
        weeks={weeks}
        filteredReservations={filteredReservations}
        weekReservationLanes={weekReservationLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
        laneGap={laneGap}
        adjacencyMap={adjacencyMap}
      />
      
      {/* Relationship Block Bars (parent-child blocks) - MEDIUM PRIORITY */}
      {relationshipBlocks && relationshipBlocks.length > 0 && (
        <RelationshipBlockBars
          weeks={weeks}
          relationshipBlocks={relationshipBlocks}
          weekRelationshipBlockLanes={weekRelationshipBlockLanes}
          laneHeight={laneHeight}
          baseOffset={baseOffset + laneHeight + laneGap}
          laneGap={laneGap}
          adjacencyMap={adjacencyMap}
        />
      )}
      
      {/* Propagated Block Bars - LOWEST PRIORITY */}
      {propagatedBlocks && propagatedBlocks.length > 0 && (
        <PropagatedBlockBars
          weeks={weeks}
          propagatedBlocks={propagatedBlocks}
          weekPropagatedBlockLanes={weekPropagatedBlockLanes}
          laneHeight={laneHeight}
          baseOffset={baseOffset + (2 * (laneHeight + laneGap))}
          laneGap={laneGap}
          adjacencyMap={adjacencyMap}
        />
      )}
    </div>
  );
};

export default ReservationBars;
