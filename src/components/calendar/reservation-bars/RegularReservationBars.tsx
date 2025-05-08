
import React from 'react';
import { Reservation } from '@/types';
import ReservationBar from '../ReservationBar';

interface RegularReservationBarsProps {
  weeks: (Date | null)[][];
  filteredReservations: Reservation[];
  weekReservationLanes: Record<number, Record<string, number>>;
  barHeight: number;
  baseVerticalPosition: number;
  cellHeight: number;
}

const RegularReservationBars: React.FC<RegularReservationBarsProps> = ({
  weeks,
  filteredReservations,
  weekReservationLanes,
  barHeight,
  baseVerticalPosition,
  cellHeight
}) => {
  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div 
          key={`reservations-week-${weekIndex}`} 
          className="grid grid-cols-7 w-full absolute" 
          style={{ 
            top: `${weekIndex * cellHeight}px`, 
            height: `${cellHeight}px` 
          }}
        >
          <div className="col-span-7 relative h-full w-full">
            {filteredReservations.map((reservation) => {
              // Check if reservation intersects with this week
              const startDate = new Date(reservation.startDate);
              const endDate = new Date(reservation.endDate);
              
              // Check if week intersects with reservation
              const weekStart = week.find(day => day !== null);
              const weekEnd = [...week].reverse().find(day => day !== null);
              
              if (!weekStart || !weekEnd) return null;
              
              // Normalize dates for comparison
              const normalizedWeekStart = new Date(weekStart);
              normalizedWeekStart.setHours(12, 0, 0, 0);
              
              const normalizedWeekEnd = new Date(weekEnd);
              normalizedWeekEnd.setHours(12, 0, 0, 0);
              
              const normalizedStartDate = new Date(startDate);
              normalizedStartDate.setHours(12, 0, 0, 0);
              
              const normalizedEndDate = new Date(endDate);
              normalizedEndDate.setHours(12, 0, 0, 0);
              
              // Check for intersection
              const reservationStartsBeforeWeekEnds = normalizedStartDate <= normalizedWeekEnd;
              const reservationEndsAfterWeekStarts = normalizedEndDate >= normalizedWeekStart;
              
              const hasIntersection = reservationStartsBeforeWeekEnds && reservationEndsAfterWeekStarts;
              
              if (!hasIntersection) return null;
              
              // Siempre usa la misma posición vertical para todas las reservaciones
              return (
                <ReservationBar
                  key={`res-${weekIndex}-${reservation.id}`}
                  reservation={reservation}
                  week={week}
                  weekIndex={weekIndex}
                  lane={0} // Lane no afecta la posición vertical
                  barHeight={barHeight}
                  verticalPosition={baseVerticalPosition}
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
