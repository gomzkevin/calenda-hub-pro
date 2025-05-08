
import React from 'react';
import { Reservation } from '@/types';
import ReservationBar from '../ReservationBar';

interface RegularReservationBarsProps {
  weeks: (Date | null)[][];
  filteredReservations: Reservation[];
  weekReservationLanes: Record<number, Record<string, number>>;
  laneHeight: number;
  baseOffset: number;
  laneGap: number;
}

const RegularReservationBars: React.FC<RegularReservationBarsProps> = ({
  weeks,
  filteredReservations,
  weekReservationLanes,
  laneHeight,
  baseOffset,
  laneGap
}) => {
  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`reservations-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {filteredReservations.map((reservation) => {
              // Verificar si la reserva intersecta con esta semana
              const startDate = new Date(reservation.startDate);
              const endDate = new Date(reservation.endDate);
              
              // Verificar si la semana intersecta con la reserva
              const weekStart = week.find(day => day !== null);
              const weekEnd = [...week].reverse().find(day => day !== null);
              
              if (!weekStart || !weekEnd) return null;
              
              // Normalizar fechas para comparación
              const normalizedWeekStart = new Date(weekStart);
              normalizedWeekStart.setHours(12, 0, 0, 0);
              
              const normalizedWeekEnd = new Date(weekEnd);
              normalizedWeekEnd.setHours(12, 0, 0, 0);
              
              const normalizedStartDate = new Date(startDate);
              normalizedStartDate.setHours(12, 0, 0, 0);
              
              const normalizedEndDate = new Date(endDate);
              normalizedEndDate.setHours(12, 0, 0, 0);
              
              // Comprobar si hay intersección
              const reservationStartsBeforeWeekEnds = normalizedStartDate <= normalizedWeekEnd;
              const reservationEndsAfterWeekStarts = normalizedEndDate >= normalizedWeekStart;
              
              const hasIntersection = reservationStartsBeforeWeekEnds && reservationEndsAfterWeekStarts;
              
              if (!hasIntersection) return null;
              
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
      ))}
    </>
  );
};

export default RegularReservationBars;
