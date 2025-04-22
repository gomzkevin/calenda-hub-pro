
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
  // Function to check if there's a propagated block on a specific date
  const checkForNeighboringBlocks = (date: Date, propertyId: string): boolean => {
    // Normalize the date for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);
    
    // Look for any propagated block that starts or ends on this date for this property
    return propagatedBlocks.some(block => {
      if (block.propertyId !== propertyId) return false;
      
      const blockStartDate = new Date(block.startDate);
      blockStartDate.setHours(12, 0, 0, 0);
      
      const blockEndDate = new Date(block.endDate);
      blockEndDate.setHours(12, 0, 0, 0);
      
      // Check if the propagated block starts or ends exactly on this date
      const isStartDateMatch = blockStartDate.getTime() === normalizedDate.getTime();
      const isEndDateMatch = blockEndDate.getTime() === normalizedDate.getTime();
      
      console.log(`Checking block ${block.id} against date ${normalizedDate.toISOString()}: ` +
                 `Start: ${isStartDateMatch}, End: ${isEndDateMatch}, Property: ${propertyId}`);
                 
      return isStartDateMatch || isEndDateMatch;
    });
  };

  return (
    <>
      {weeks.map((week, weekIndex) => (
        <div key={`reservations-week-${weekIndex}`} className="grid grid-cols-7 w-full absolute" style={{ top: `${weekIndex * 100}px`, height: '100px' }}>
          <div className="col-span-7 relative h-full w-full">
            {filteredReservations.map((reservation) => {
              // Verify if the reservation intersects with this week
              const startDate = new Date(reservation.startDate);
              const endDate = new Date(reservation.endDate);
              
              // Check if at least one day of the week is between the reservation dates
              const anyDayInWeek = week.find(day => day !== null);
              if (!anyDayInWeek) return null;
              
              // Check if the week intersects with the reservation
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
              
              // Check if there's an intersection between the reservation and the week
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
                  laneGap={laneGap}
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
