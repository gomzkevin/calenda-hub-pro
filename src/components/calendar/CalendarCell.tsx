
import React from 'react';
import { isSameMonth } from 'date-fns';
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

  // Identify relationship blocks for this day to visually mark the cell
  const normalizedDay = normalizeDate(day);
  
  // Filter relationship blocks for this specific day
  const dayRelationshipBlocks = relationshipBlocks.filter(block => 
    normalizedDay <= block.endDate && normalizedDay >= block.startDate
  );
  
  const hasRelationshipBlock = dayRelationshipBlocks.length > 0;
  
  // Check if we have a child-to-parent block (useful for different styling)
  const hasChildToParentBlock = dayRelationshipBlocks.some(block => 
    block.notes?.includes('child property reservation')
  );
  
  const isCurrentMonth = isSameMonth(day, currentMonth);
  
  // Determine appropriate background color based on block type
  let bgColorClass = '';
  if (hasRelationshipBlock) {
    bgColorClass = hasChildToParentBlock ? 'bg-amber-50' : 'bg-gray-100';
  } else {
    bgColorClass = !isCurrentMonth ? 'bg-gray-50' : '';
  }
  
  return (
    <div 
      className={`calendar-day border relative ${bgColorClass}`}
      style={{ height: `${cellHeight}px` }}
    >
      <div className="text-sm font-medium p-1">
        {day.getDate()}
      </div>
      
      {/* Day indicator for relationship blocks */}
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
