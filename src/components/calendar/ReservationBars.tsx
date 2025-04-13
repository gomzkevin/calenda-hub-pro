
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
  // Simplified constants for the single-lane layout
  const laneHeight = 24; // Height for the reservation lane
  const baseOffset = 30; // Base offset from top
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Regular Reservation bars - HIGHEST PRIORITY */}
      <RegularReservationBars
        weeks={weeks}
        filteredReservations={filteredReservations}
        weekReservationLanes={weekReservationLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
      />
      
      {/* Only render block bars if there are no regular reservations for those days */}
      {/* Relationship Block Bars (parent-child blocks) */}
      {relationshipBlocks && relationshipBlocks.length > 0 && (
        <RelationshipBlockBars
          weeks={weeks}
          relationshipBlocks={relationshipBlocks}
          weekRelationshipBlockLanes={weekRelationshipBlockLanes}
          laneHeight={laneHeight}
          baseOffset={baseOffset}
        />
      )}
      
      {/* Regular Propagated Block Bars */}
      {propagatedBlocks && propagatedBlocks.length > 0 && (
        <PropagatedBlockBars
          weeks={weeks}
          propagatedBlocks={propagatedBlocks}
          weekPropagatedBlockLanes={weekPropagatedBlockLanes}
          laneHeight={laneHeight}
          baseOffset={baseOffset}
        />
      )}
    </div>
  );
};

export default ReservationBars;
