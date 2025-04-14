
import React, { useState } from 'react';
import CalendarDayHeader from '../CalendarDayHeader';
import CalendarGrid from '../CalendarGrid';
import ReservationBars from '../ReservationBars';
import CalendarLegend from '../CalendarLegend';
import { useRelatedProperties } from './hooks/useRelatedProperties';
import { useMonthlyReservations } from './hooks/useMonthlyReservations';
import { useCalendarGrid } from './hooks/useCalendarGrid';
import MonthlyCalendarHeader from './MonthlyCalendarHeader';

interface MonthlyCalendarViewProps {
  propertyId?: string;
}

const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ propertyId }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Get related properties
  const { relatedPropertyIds, property } = useRelatedProperties(propertyId);
  
  // Get reservations - ahora pasando el objeto property completo
  const { 
    filteredReservations, 
    propagatedBlocks, 
    relationshipBlocks,
    isLoading 
  } = useMonthlyReservations(currentMonth, propertyId, relatedPropertyIds, property);
  
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
    <div className="bg-white rounded-lg shadow monthly-calendar-container flex flex-col h-full overflow-hidden">
      <MonthlyCalendarHeader 
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
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
