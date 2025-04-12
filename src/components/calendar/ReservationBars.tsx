
import React from 'react';
import { Reservation } from '@/types';
import RegularReservationBars from './reservation-bars/RegularReservationBars';
import RelationshipBlockBars from './reservation-bars/RelationshipBlockBars';
import PropagatedBlockBars from './reservation-bars/PropagatedBlockBars';

interface ReservationBarsProps {
  weeks: (Date | null)[][];
  filteredReservations: Reservation[];
  relationshipBlocks: Reservation[];
  propagatedBlocks: Reservation[];
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
  // Constants for layout calculations
  const laneHeight = 14; // Height for each reservation lane
  const baseOffset = 40; // Adjusted base offset from top
  
  return (
    <>
      {/* Regular Reservation bars */}
      <RegularReservationBars
        weeks={weeks}
        filteredReservations={filteredReservations}
        weekReservationLanes={weekReservationLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
      />
      
      {/* Relationship Block Bars (parent-child blocks) */}
      <RelationshipBlockBars
        weeks={weeks}
        relationshipBlocks={relationshipBlocks}
        weekRelationshipBlockLanes={weekRelationshipBlockLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
      />
      
      {/* Regular Propagated Block Bars */}
      <PropagatedBlockBars
        weeks={weeks}
        propagatedBlocks={propagatedBlocks}
        weekPropagatedBlockLanes={weekPropagatedBlockLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
      />
    </>
  );
};

export default ReservationBars;
