
import { useMemo } from 'react';
import { addMonths } from 'date-fns';
import { Reservation } from '@/types';
import { 
  calculateReservationLanes, 
  calculateBlockLanes 
} from '../../utils/laneCalculation';
import { generateMonthDays } from '../../utils/dateUtils';

export const useCalendarGrid = (
  currentMonth: Date,
  filteredReservations: Reservation[],
  propagatedBlocks: Reservation[] | undefined,
  relationshipBlocks: Reservation[] | undefined
) => {
  // Generate the days for the current month
  const weeks = useMemo(() => generateMonthDays(currentMonth), [currentMonth]);
  
  // Calculate reservation lanes for each week
  const weekReservationLanes = useMemo(() => {
    return calculateReservationLanes(weeks, filteredReservations || []);
  }, [weeks, filteredReservations]);
  
  // Calculate propagated block lanes for each week
  const weekPropagatedBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, propagatedBlocks);
  }, [weeks, propagatedBlocks]);
  
  // Calculate relationship block lanes for each week
  const weekRelationshipBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, relationshipBlocks);
  }, [weeks, relationshipBlocks]);
  
  // Fixed cell height for all calendar cells
  const cellHeight = 120; // Fixed height for consistent layout
  
  // Navigation handlers
  const nextMonth = () => {
    return addMonths(currentMonth, 1);
  };
  
  const prevMonth = () => {
    return addMonths(currentMonth, -1);
  };

  return {
    weeks,
    cellHeight,
    weekReservationLanes,
    weekPropagatedBlockLanes,
    weekRelationshipBlockLanes,
    nextMonth,
    prevMonth
  };
};
