
import React from 'react';
import { isSameMonth, isSameDay } from 'date-fns';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
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
        className="calendar-day border bg-gray-50"
        style={{ height: `${cellHeight}px` }}
      />
    );
  }

  const normalizedDay = normalizeDate(day);
  const dayRelationshipBlocks = relationshipBlocks.filter(block => 
    normalizedDay <= block.endDate && normalizedDay >= block.startDate
  );
  
  const hasRelationshipBlock = dayRelationshipBlocks.length > 0;
  const hasChildToParentBlock = dayRelationshipBlocks.some(block => 
    block.notes?.includes('child property reservation')
  );
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isToday = isSameDay(day, new Date());
  
  let bgColorClass = '';
  if (isToday) {
    bgColorClass = 'bg-blue-100 border-blue-500 border-2';
  } else if (hasRelationshipBlock) {
    bgColorClass = hasChildToParentBlock ? 'bg-amber-50' : 'bg-gray-100';
  } else if (!isCurrentMonth) {
    bgColorClass = 'bg-gray-50';
  }
  
  return (
    <div 
      className={`calendar-day border relative ${bgColorClass}`}
      style={{ height: `${cellWidth}px` }}
    >
      <div className={`text-sm p-1 ${isToday ? 'font-bold text-blue-700' : 'font-medium'}`}>
        {day.getDate()}
      </div>
      
      {hasRelationshipBlock && (
        <div className="absolute top-1 right-1">
          {hasChildToParentBlock ? (
            <AlertTriangle size={14} className="text-amber-500" />
          ) : (
            <ShieldAlert size={14} className="text-gray-500" />
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarCell;
