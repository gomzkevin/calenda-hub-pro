
import React from 'react';
import { isSameMonth } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import { Reservation } from '@/types';
import { normalizeDate } from './utils/dateUtils';

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
    <>
      {weeks.map((week, weekIndex) => (
        <React.Fragment key={`week-${weekIndex}`}>
          {week.map((day, dayIndex) => {
            // Identify relationship blocks for this day to visually mark the cell
            const hasRelationshipBlock = day && relationshipBlocks.some(block => {
              const normalizedDay = normalizeDate(day);
              return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
            });
            
            return (
              <div 
                key={`day-${weekIndex}-${dayIndex}`} 
                className={`calendar-day border relative ${day && !isSameMonth(day, currentMonth) ? 'bg-gray-50' : ''} ${hasRelationshipBlock ? 'bg-amber-50' : ''}`}
                style={{ height: `${cellHeight}px` }}
              >
                {day && (
                  <>
                    <div className="text-sm font-medium p-1">
                      {day.getDate()}
                    </div>
                    
                    {/* Day indicator for relationship blocks */}
                    {hasRelationshipBlock && (
                      <div className="absolute top-1 right-1">
                        <ShieldAlert size={14} className="text-amber-500" />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};

export default CalendarGrid;
