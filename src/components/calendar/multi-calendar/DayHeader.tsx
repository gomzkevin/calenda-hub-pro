
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
      className={`min-w-[80px] w-[80px] h-10 flex flex-col items-center justify-center font-medium text-xs border-r ${
        isToday ? 'bg-blue-50' : ''
      }`}
    >
      <span>{format(day, 'EEE')}</span>
      <span>{format(day, 'd MMM')}</span>
    </div>
  );
};

export default DayHeader;
