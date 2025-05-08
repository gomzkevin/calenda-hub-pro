
import React from 'react';
import MultiCalendarComponent from './multi-calendar/MultiCalendar';

interface MultiCalendarProps {
  onPropertySelect?: (propertyId: string) => void;
}

const MultiCalendar: React.FC<MultiCalendarProps> = ({ onPropertySelect }) => {
  return <MultiCalendarComponent onPropertySelect={onPropertySelect} />;
};

export default MultiCalendar;
