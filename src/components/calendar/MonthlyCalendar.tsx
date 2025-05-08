
import React, { memo } from 'react';
import MonthlyCalendarView from './monthly-calendar/MonthlyCalendarView';

interface MonthlyCalendarProps {
  propertyId?: string;
}

// Using React.memo to prevent unnecessary re-renders
const MonthlyCalendar: React.FC<MonthlyCalendarProps> = memo(({ propertyId }) => {
  // Pass the propertyId to the view component
  return (
    <div className="h-full flex-1 flex flex-col">
      <MonthlyCalendarView propertyId={propertyId} />
    </div>
  );
});

export default MonthlyCalendar;
