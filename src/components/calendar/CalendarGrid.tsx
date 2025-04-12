
import React from 'react';
import { Reservation } from '@/types';
import CalendarCell from './CalendarCell';

interface CalendarGridProps {
  weeks: (Date | null)[][];
  currentMonth: Date;
  relationshipBlocks: Reservation[];
  cellHeight: number;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  weeks, 
  currentMonth, 
  relationshipBlocks,
  cellHeight 
}) => {
  return (
    <div className="grid grid-cols-7 relative w-full">
      {weeks.map((week, weekIndex) => (
        <React.Fragment key={`week-${weekIndex}`}>
          {week.map((day, dayIndex) => (
            <CalendarCell
              key={`day-${weekIndex}-${dayIndex}`}
              day={day}
              currentMonth={currentMonth}
              relationshipBlocks={relationshipBlocks}
              cellHeight={cellHeight}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CalendarGrid;
