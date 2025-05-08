
import React from 'react';
import MultiCalendar from './multi-calendar/MultiCalendar';

// This is a barrel file to maintain backward compatibility
interface MultiCalendarProps {
  onPropertyClick?: (propertyId: string) => void;
}

const MultiCalendarWrapper: React.FC<MultiCalendarProps> = (props) => {
  return <MultiCalendar {...props} />;
};

export default MultiCalendarWrapper;
