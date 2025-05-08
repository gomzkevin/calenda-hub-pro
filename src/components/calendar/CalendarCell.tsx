
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
        className="calendar-day border border-gray-200 bg-gray-50"
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
  let textColorClass = isCurrentMonth ? 'text-gray-900' : 'text-gray-400';
  
  if (isToday) {
    bgColorClass = 'bg-blue-50 border-blue-500 border-2';
    textColorClass = 'text-blue-800';
  } else if (hasRelationshipBlock) {
    bgColorClass = hasChildToParentBlock ? 'bg-amber-50' : 'bg-gray-100';
  } else if (!isCurrentMonth) {
    bgColorClass = 'bg-gray-50';
  } else {
    bgColorClass = 'bg-white hover:bg-gray-50 transition-colors';
  }
  
  return (
    <div 
      className={`calendar-day border border-gray-200 relative ${bgColorClass}`}
      style={{ height: `${cellHeight}px` }}
    >
      <div className={`text-sm p-1.5 ${isToday ? 'font-bold' : 'font-medium'} ${textColorClass}`}>
        {isToday ? (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white">
            {day.getDate()}
          </div>
        ) : (
          day.getDate()
        )}
      </div>
      
      {hasRelationshipBlock && (
        <div className="absolute top-1.5 right-1.5">
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
