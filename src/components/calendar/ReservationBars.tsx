
import React from 'react';
import { Reservation } from '@/types';
import ReservationBar from './ReservationBar';
import RelationshipBlockBar from './RelationshipBlockBar';
import PropagatedBlockBar from './PropagatedBlockBar';

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
  const baseOffset = -70; // Base offset from top
  
  return (
    <>
      {/* Regular Reservation bars */}
      {weeks.map((week, weekIndex) => (
        <div key={`reservations-week-${weekIndex}`} className="col-span-7 relative h-0">
          {week[0] && filteredReservations.filter(reservation => {
            return week.some(day => {
              if (!day) return false;
              const normalizedDay = new Date(day);
              normalizedDay.setUTCHours(12, 0, 0, 0);
              return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
            });
          }).map((reservation) => {
            const weekLanes = weekReservationLanes[weekIndex] || {};
            const lane = weekLanes[reservation.id] || 0;
            
            return (
              <ReservationBar
                key={`res-${weekIndex}-${reservation.id}`}
                reservation={reservation}
                week={week}
                weekIndex={weekIndex}
                lane={lane}
                laneHeight={laneHeight}
                baseOffset={baseOffset}
              />
            );
          })}
        </div>
      ))}
      
      {/* Relationship Block Bars (parent-child blocks) */}
      {weeks.map((week, weekIndex) => (
        <div key={`relationship-week-${weekIndex}`} className="col-span-7 relative h-0">
          {week[0] && relationshipBlocks.filter(block => {
            return week.some(day => {
              if (!day) return false;
              const normalizedDay = new Date(day);
              normalizedDay.setUTCHours(12, 0, 0, 0);
              return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
            });
          }).map((block) => {
            const relationshipLanes = weekRelationshipBlockLanes[weekIndex] || {};
            const lane = relationshipLanes[block.id] || 5;
            
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
      ))}
      
      {/* Regular Propagated Block Bars */}
      {weeks.map((week, weekIndex) => (
        <div key={`propagated-week-${weekIndex}`} className="col-span-7 relative h-0">
          {week[0] && propagatedBlocks.filter(block => {
            return week.some(day => {
              if (!day) return false;
              const normalizedDay = new Date(day);
              normalizedDay.setUTCHours(12, 0, 0, 0);
              return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
            });
          }).map((block) => {
            const blockLanes = weekPropagatedBlockLanes[weekIndex] || {};
            const lane = blockLanes[block.id] || 10;
            
            return (
              <PropagatedBlockBar
                key={`block-${weekIndex}-${block.id}`}
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
      ))}
    </>
  );
};

export default ReservationBars;
