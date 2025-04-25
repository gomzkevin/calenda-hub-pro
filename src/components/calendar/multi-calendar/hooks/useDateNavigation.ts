
import { useState, useMemo } from 'react';
import { addDays, subDays } from 'date-fns';

const DAYS_TO_SHOW = 15;
const DAYS_BEFORE_TODAY = 4;

export const useDateNavigation = () => {
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    return subDays(today, DAYS_BEFORE_TODAY);
  });
  
  const visibleDays = useMemo(() => 
    Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i)),
  [startDate]);
  
  const endDate = useMemo(() => addDays(startDate, DAYS_TO_SHOW - 1), [startDate]);
  
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
