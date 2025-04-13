
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
    return calculateBlockLanes(weeks, propagatedBlocks, 10);
  }, [weeks, propagatedBlocks]);
  
  // Calculate relationship block lanes for each week
  const weekRelationshipBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, relationshipBlocks, 5);
  }, [weeks, relationshipBlocks]);
  
  // Calculate cell height based on maximum lanes
  const calculateCellHeight = () => {
    const maxLanes: { [key: number]: number } = {};
    
    weeks.forEach((_, weekIndex) => {
      const weekLanes = weekReservationLanes[weekIndex] || {};
      const blockLanes = weekPropagatedBlockLanes[weekIndex] || {};
      const relationshipLanes = weekRelationshipBlockLanes[weekIndex] || {};
      
      const maxRegularLane = Object.values(weekLanes).reduce((max, lane) => Math.max(max, lane), 0);
      const maxBlockLane = Object.values(blockLanes).reduce((max, lane) => Math.max(max, lane), 0);
      const maxRelationshipLane = Object.values(relationshipLanes).reduce((max, lane) => Math.max(max, lane), 0);
      
      maxLanes[weekIndex] = Math.max(maxRegularLane, Math.max(maxBlockLane - 10, maxRelationshipLane - 5));
    });
    
    const maxLaneAcrossWeeks = Object.values(maxLanes).reduce((max, lane) => Math.max(max, lane), 0);
    const laneHeight = 14; // Height for each reservation lane
    const minCellHeight = 120; // Minimum height for calendar cells
    return Math.max(minCellHeight, 80 + (maxLaneAcrossWeeks * laneHeight));
  };
  
  const cellHeight = useMemo(() => calculateCellHeight(), [
    weekReservationLanes, 
    weekPropagatedBlockLanes, 
    weekRelationshipBlockLanes
  ]);
  
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
