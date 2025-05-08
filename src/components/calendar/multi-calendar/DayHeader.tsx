
import React from 'react';
import { format, isSameDay } from 'date-fns';

interface DayHeaderProps {
  day: Date;
  index: number;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, index }) => {
  const isToday = isSameDay(day, new Date());
  
  return (
    <div 
      key={`header-${index}`}
      className={`sticky top-0 z-10 bg-white border-b border-gray-200 h-12 flex flex-col items-center justify-center font-medium text-xs ${
        isToday ? 'bg-blue-50 border-b-2 border-blue-500 text-blue-700' : 'text-gray-600'
      }`}
    >
      <span className="font-bold">{format(day, 'EEE')}</span>
      <span>{format(day, 'd MMM')}</span>
    </div>
  );
};

export default DayHeader;
