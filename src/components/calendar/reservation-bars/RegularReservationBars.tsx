
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
      {weeks.map((week, weekIndex) => (
        <div key={`reservations-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {week[0] && filteredReservations.filter(reservation => {
              return week.some(day => {
                if (!day) return false;
                const normalizedDay = new Date(day);
                normalizedDay.setUTCHours(12, 0, 0, 0);
                return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
              });
            }).map((reservation) => {
              // Get lane assignment (if available) or default to 0
              const laneKey = `${weekIndex}-${reservation.id}`;
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
      ))}
    </>
  );
};

export default RegularReservationBars;
