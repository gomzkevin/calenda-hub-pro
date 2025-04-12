
import React from 'react';
import MonthlyCalendarView from './monthly-calendar/MonthlyCalendarView';

interface MonthlyCalendarProps {
  propertyId?: string;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ propertyId }) => {
  return <MonthlyCalendarView propertyId={propertyId} />;
};

export default MonthlyCalendar;
