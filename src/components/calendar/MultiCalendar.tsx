
import React, { memo } from 'react';
import MultiCalendar from './multi-calendar/MultiCalendar';

// This is a barrel file to maintain backward compatibility
interface MultiCalendarProps {
  onPropertyClick?: (propertyId: string) => void;
}

// Adding memo to prevent unnecessary re-renders
const MultiCalendarWrapper: React.FC<MultiCalendarProps> = memo(({ onPropertyClick }) => {
  return <MultiCalendar onPropertyClick={onPropertyClick} />;
});

export default MultiCalendarWrapper;
