
import React, { useState } from 'react';
import { Reservation } from '@/types';
import CalendarHeader from '../CalendarHeader';
import CalendarDayHeader from '../CalendarDayHeader';
import CalendarGrid from '../CalendarGrid';
import ReservationBars from '../ReservationBars';
import CalendarLegend from '../CalendarLegend';
import { useRelatedProperties } from './hooks/useRelatedProperties';
import { useMonthlyReservations } from './hooks/useMonthlyReservations';
import { useCalendarGrid } from './hooks/useCalendarGrid';

interface MonthlyCalendarViewProps {
  propertyId?: string;
}

const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ propertyId }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Get related properties
  const { relatedPropertyIds } = useRelatedProperties(propertyId);
  
  // Get reservations
  const { 
    filteredReservations, 
    propagatedBlocks, 
    relationshipBlocks,
    isLoading 
  } = useMonthlyReservations(currentMonth, propertyId, relatedPropertyIds);
  
  // Setup calendar grid
  const {
    weeks,
    cellHeight,
    weekReservationLanes,
    weekPropagatedBlockLanes,
    weekRelationshipBlockLanes,
    nextMonth,
    prevMonth
  } = useCalendarGrid(currentMonth, filteredReservations, propagatedBlocks, relationshipBlocks);
  
  // Navigation handlers
  const handleNextMonth = () => {
    setCurrentMonth(nextMonth());
  };
  
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth());
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <CalendarHeader 
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-7">
            <CalendarDayHeader />
          </div>
          
          <div className="relative">
            <CalendarGrid
              weeks={weeks}
              currentMonth={currentMonth}
              relationshipBlocks={relationshipBlocks}
              cellHeight={cellHeight}
            />
            
            <ReservationBars
              weeks={weeks}
              filteredReservations={filteredReservations}
              relationshipBlocks={relationshipBlocks}
              propagatedBlocks={propagatedBlocks}
              weekReservationLanes={weekReservationLanes}
              weekRelationshipBlockLanes={weekRelationshipBlockLanes}
              weekPropagatedBlockLanes={weekPropagatedBlockLanes}
            />
          </div>
        </div>
      )}
      
      <CalendarLegend />
    </div>
  );
};

export default MonthlyCalendarView;
