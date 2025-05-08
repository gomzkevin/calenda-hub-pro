
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
  
  // Use fixed cell height for consistency across all cells
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
    
    // Fixed cell height regardless of content
    return 120;
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
