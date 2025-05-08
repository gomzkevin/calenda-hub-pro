
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
  
  // Calculate reservation lanes for each week - now using simplified single-lane approach
  const weekReservationLanes = useMemo(() => {
    return calculateReservationLanes(weeks, filteredReservations || []);
  }, [weeks, filteredReservations]);
  
  // Calculate propagated block lanes for each week - now using simplified single-lane approach
  const weekPropagatedBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, propagatedBlocks);
  }, [weeks, propagatedBlocks]);
  
  // Calculate relationship block lanes for each week - now using simplified single-lane approach
  const weekRelationshipBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, relationshipBlocks);
  }, [weeks, relationshipBlocks]);
  
  // Improved cell height calculation for better visibility
  const cellHeight = useMemo(() => {
    // Calculate maximum number of lanes needed for any week
    const maxLanes = Math.max(
      ...Object.values(weekReservationLanes).map(lanes => 
        Object.values(lanes).length > 0 ? Math.max(...Object.values(lanes)) + 1 : 1
      ),
      ...Object.values(weekRelationshipBlockLanes).map(lanes => 
        Object.values(lanes).length > 0 ? Math.max(...Object.values(lanes)) + 1 : 0
      ),
      ...Object.values(weekPropagatedBlockLanes).map(lanes => 
        Object.values(lanes).length > 0 ? Math.max(...Object.values(lanes)) + 1 : 0
      )
    );
    
    // Base height + extra space for each lane
    return Math.max(110, 80 + (maxLanes * 30));
  }, [weekReservationLanes, weekRelationshipBlockLanes, weekPropagatedBlockLanes]);
  
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
