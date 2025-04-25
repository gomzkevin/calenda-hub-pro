
import React from 'react';
import { format, isSameDay } from 'date-fns';

interface DayHeaderProps {
  day: Date;
  index: number;
  width?: string;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, index, width = "80px" }) => {
  const isToday = isSameDay(day, new Date());
  
  return (
    <div 
      className={`border-r h-10 flex flex-col items-center justify-center text-sm ${
        isToday ? 'bg-blue-50 font-bold' : ''
      }`}
      style={{ 
        width, 
        minWidth: width,
        maxWidth: width
      }}
    >
      <span>{format(day, 'EEE')}</span>
      <span>{format(day, 'd MMM')}</span>
    </div>
  );
};

export default DayHeader;
