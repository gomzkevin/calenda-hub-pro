
import React, { memo } from 'react';
import MultiCalendarComponent from './multi-calendar/MultiCalendar';

interface MultiCalendarProps {
  onPropertySelect?: (propertyId: string) => void;
}

// Use memo to prevent unnecessary re-renders
const MultiCalendar: React.FC<MultiCalendarProps> = memo(({ onPropertySelect }) => {
  return <MultiCalendarComponent onPropertySelect={onPropertySelect} />;
});

MultiCalendar.displayName = 'MultiCalendar';

export default MultiCalendar;
