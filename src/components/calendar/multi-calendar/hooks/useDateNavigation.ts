
import { useState, useMemo } from 'react';
import { addDays } from 'date-fns';

// Define the number of days to show in the multi-calendar view
const DAYS_TO_SHOW = 15;

export const useDateNavigation = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  // Generate array of visible days
  const visibleDays = useMemo(() => 
    Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i)),
  [startDate]);
  
  // Calculate end date
  const endDate = useMemo(() => addDays(startDate, DAYS_TO_SHOW - 1), [startDate]);
  
  // Navigation handlers
  const goForward = () => {
    setStartDate(addDays(startDate, DAYS_TO_SHOW));
  };
  
  const goBackward = () => {
    setStartDate(addDays(startDate, -DAYS_TO_SHOW));
  };

  return {
    startDate,
    endDate,
    visibleDays,
    goForward,
    goBackward,
    daysToShow: DAYS_TO_SHOW
  };
};
