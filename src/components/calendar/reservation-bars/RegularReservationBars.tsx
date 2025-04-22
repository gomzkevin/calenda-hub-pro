
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
  propagatedBlocks?: Reservation[];
}

const RegularReservationBars: React.FC<RegularReservationBarsProps> = ({
  weeks,
  filteredReservations,
  weekReservationLanes,
  laneHeight,
  baseOffset,
  laneGap,
  propagatedBlocks = []
}) => {
  // Función para comprobar si hay un bloque propagado en una fecha específica
  const checkForNeighboringBlocks = (date: Date, propertyId: string): boolean => {
    // Normalizar la fecha para comparación
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);
    
    // Buscar si hay algún bloque propagado que comience o termine en esta fecha
    return propagatedBlocks.some(block => {
      if (block.propertyId !== propertyId) return false;
      
      const blockStartDate = new Date(block.startDate);
      blockStartDate.setHours(12, 0, 0, 0);
      
      const blockEndDate = new Date(block.endDate);
      blockEndDate.setHours(12, 0, 0, 0);
      
      return blockStartDate.getTime() === normalizedDate.getTime() || 
             blockEndDate.getTime() === normalizedDate.getTime();
    });
  };

  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`reservations-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {filteredReservations.map((reservation) => {
              // Verificar si la reserva intersecta con esta semana
              const startDate = new Date(reservation.startDate);
              const endDate = new Date(reservation.endDate);
              
              // Verificar si al menos un día de la semana está entre las fechas de la reserva
              const anyDayInWeek = week.find(day => day !== null);
              if (!anyDayInWeek) return null;
              
              // Verificar si la semana intersecta con la reserva
              const weekStart = week.find(day => day !== null);
              const weekEnd = [...week].reverse().find(day => day !== null);
              
              if (!weekStart || !weekEnd) return null;
              
              // Normalizar fechas para comparación (mediodía para evitar problemas de zona horaria)
              const normalizedWeekStart = new Date(weekStart);
              normalizedWeekStart.setHours(12, 0, 0, 0);
              
              const normalizedWeekEnd = new Date(weekEnd);
              normalizedWeekEnd.setHours(12, 0, 0, 0);
              
              const normalizedStartDate = new Date(startDate);
              normalizedStartDate.setHours(12, 0, 0, 0);
              
              const normalizedEndDate = new Date(endDate);
              normalizedEndDate.setHours(12, 0, 0, 0);
              
              // Comprobar si hay intersección entre la reserva y la semana
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
                  checkForNeighboringBlocks={checkForNeighboringBlocks}
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
