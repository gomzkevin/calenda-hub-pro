
import React from 'react';
import MonthlyCalendarView from './monthly-calendar/MonthlyCalendarView';

interface MonthlyCalendarProps {
  propertyId?: string;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ propertyId }) => {
  // Just pass the propertyId to the view component
  return <MonthlyCalendarView propertyId={propertyId} />;
};

export default MonthlyCalendar;
