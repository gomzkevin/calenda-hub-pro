
import React from 'react';
import { Reservation } from '@/types';
import RegularReservationBars from './reservation-bars/RegularReservationBars';
import BlockedReservationBars from './reservation-bars/PropagatedBlockBars';

interface ReservationBarsProps {
  weeks: (Date | null)[][];
  filteredReservations: Reservation[];
  blockedReservations: Reservation[];
  weekReservationLanes: Record<number, Record<string, number>>;
  weekBlockedLanes: Record<number, Record<string, number>>;
  laneHeight?: number;
  baseOffset?: number;
}

const ReservationBars: React.FC<ReservationBarsProps> = ({
  weeks,
  filteredReservations,
  blockedReservations,
  weekReservationLanes,
  weekBlockedLanes,
  laneHeight = 14,
  baseOffset = 40
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Regular Reservation bars */}
      <RegularReservationBars
        weeks={weeks}
        filteredReservations={filteredReservations}
        weekReservationLanes={weekReservationLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
      />
      
      {/* Blocked Reservation Bars */}
      <BlockedReservationBars
        weeks={weeks}
        propagatedBlocks={blockedReservations}
        weekPropagatedBlockLanes={weekBlockedLanes}
        laneHeight={laneHeight}
        baseOffset={baseOffset}
      />
    </div>
  );
};

export default ReservationBars;
