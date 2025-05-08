
import React from 'react';
import { format } from 'date-fns';

export interface DayHeaderProps {
  day: Date;
  dayIndex: number;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, dayIndex }) => {
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const isToday = new Date().toDateString() === day.toDateString();
  
  return (
    <div 
      className={`
        h-10 flex flex-col items-center justify-center border-b border-gray-200 
        ${isWeekend ? 'bg-gray-50' : 'bg-white'} 
        ${isToday ? 'font-bold' : ''}
      `}
    >
      <div className="text-xs uppercase text-gray-500">
        {format(day, 'EEE')}
      </div>
      <div className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
        {format(day, 'd')}
      </div>
    </div>
  );
};

export default DayHeader;
