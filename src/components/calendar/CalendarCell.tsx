
import React from 'react';
import { isSameMonth } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import { Reservation } from '@/types';
import { normalizeDate } from './utils/dateUtils';

interface CalendarCellProps {
  day: Date | null;
  currentMonth: Date;
  relationshipBlocks: Reservation[];
  cellHeight: number;
}

const CalendarCell: React.FC<CalendarCellProps> = ({ 
  day, 
  currentMonth, 
  relationshipBlocks,
  cellHeight 
}) => {
  if (!day) {
    return (
      <div 
        className="calendar-day border"
        style={{ height: `${cellHeight}px` }}
      />
    );
  }

  // Identify relationship blocks for this day to visually mark the cell
  const hasRelationshipBlock = relationshipBlocks.some(block => {
    const normalizedDay = normalizeDate(day);
    return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
  });
  
  const isCurrentMonth = isSameMonth(day, currentMonth);
  
  return (
    <div 
      className={`calendar-day border relative ${!isCurrentMonth ? 'bg-gray-50' : ''} ${hasRelationshipBlock ? 'bg-amber-50' : ''}`}
      style={{ height: `${cellHeight}px` }}
    >
      <div className="text-sm font-medium p-1">
        {day.getDate()}
      </div>
      
      {/* Day indicator for relationship blocks */}
      {hasRelationshipBlock && (
        <div className="absolute top-1 right-1">
          <ShieldAlert size={14} className="text-amber-500" />
        </div>
      )}
    </div>
  );
};

export default CalendarCell;
