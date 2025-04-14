import React from 'react';
import { Reservation } from '@/types';
import ReservationBar from '../ReservationBar';

interface RegularReservationBarsProps {
  weeks: (Date | null)[][];
  filteredReservations: Reservation[];
  weekReservationLanes: Record<number, Record<string, number>>;
  laneHeight: number;
  baseOffset: number;
}

const RegularReservationBars: React.FC<RegularReservationBarsProps> = ({
  weeks,
  filteredReservations,
  weekReservationLanes,
  laneHeight,
  baseOffset
}) => {
  return (
    <>
      {weeks.map((week, weekIndex) => {
        // Skip empty weeks
        if (!week[0]) return null;
        
        // Get reservations that are visible in this week
        const weekReservations = filteredReservations.filter(reservation => {
          // Only keep reservations that overlap with this week
          return week.some(day => {
            if (!day) return false;
            const normalizedDay = new Date(day);
            normalizedDay.setUTCHours(12, 0, 0, 0);
            return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
          });
        });
        
        return (
          <div 
            key={`reservations-week-${weekIndex}`} 
            className="grid grid-cols-7 w-full absolute" 
            style={{ top: `${weekIndex * 100}px`, height: '100px' }}
          >
            <div className="col-span-7 relative h-full w-full">
              {weekReservations.map((reservation) => {
                // Get lane assignment for this reservation in this week
                const lane = weekReservationLanes[weekIndex]?.[reservation.id] || 0;
                
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
          </div>
        );
      })}
    </>
  );
};

export default RegularReservationBars;
