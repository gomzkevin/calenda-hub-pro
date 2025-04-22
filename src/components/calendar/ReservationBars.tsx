
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
  // Adjusted constants for better vertical spacing and gap between reservations
  const laneHeight = 26; // Height of each reservation bar
  const baseOffset = 28; // Initial offset from the top
  const laneGap = 4;    // Gap between lanes (increased to create more visual separation)
  
  // Debug outputs
  console.log('ReservationBars - filteredReservations:', filteredReservations?.length);
  console.log('ReservationBars - relationshipBlocks:', relationshipBlocks?.length);
  console.log('ReservationBars - propagatedBlocks:', propagatedBlocks?.length);
  
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
        propagatedBlocks={propagatedBlocks} // Pass the propagated blocks to check for neighbors
      />
      
      {/* Relationship Block Bars (parent-child blocks) - MEDIUM PRIORITY */}
      {relationshipBlocks && relationshipBlocks.length > 0 && (
        <RelationshipBlockBars
          weeks={weeks}
          relationshipBlocks={relationshipBlocks}
          weekRelationshipBlockLanes={weekRelationshipBlockLanes}
          laneHeight={laneHeight}
          baseOffset={baseOffset + (laneHeight + laneGap)}
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
          baseOffset={baseOffset + (2 * (laneHeight + laneGap))}
          laneGap={laneGap}
          filteredReservations={filteredReservations} // Pass the original reservations to check for neighbors
        />
      )}
    </div>
  );
};

export default ReservationBars;
