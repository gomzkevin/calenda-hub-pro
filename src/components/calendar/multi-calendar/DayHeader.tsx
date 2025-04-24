
import React from 'react';
import { format, isSameDay } from 'date-fns';

interface DayHeaderProps {
  day: Date;
  index: number;
  width?: string;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, index, width = "70px" }) => {
  const isToday = isSameDay(day, new Date());
  
  return (
    <div 
      key={`header-${index}`}
      className={`border-b border-r h-10 flex flex-col items-center justify-center font-medium text-xs ${
        isToday ? 'bg-blue-50' : 'bg-white'
      }`}
      style={{ width, minWidth: width }}
    >
      <span>{format(day, 'EEE')}</span>
      <span>{format(day, 'd MMM')}</span>
    </div>
  );
};

export default DayHeader;
