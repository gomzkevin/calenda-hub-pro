
import React from 'react';
import MonthlyCalendarView from './monthly-calendar/MonthlyCalendarView';

interface MonthlyCalendarProps {
  propertyId?: string;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ propertyId }) => {
  // Pass the propertyId to the view component
  // Added h-full flex-1 flex flex-col to ensure height propagation
  return (
    <div className="h-full flex-1 flex flex-col">
      <MonthlyCalendarView propertyId={propertyId} />
    </div>
  );
};

export default MonthlyCalendar;
