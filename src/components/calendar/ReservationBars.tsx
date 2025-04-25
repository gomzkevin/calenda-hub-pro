
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
  // Adjusted constants for better vertical spacing
  const laneHeight = 26; // Increased height for better separation
  const baseOffset = 28; // Adjusted base offset
  const laneGap = 2;    // Gap between lanes
  
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
        />
      )}
    </div>
  );
};

export default ReservationBars;
