
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
  blockedReservations: Reservation[]
) => {
  // Generate the days for the current month
  const weeks = useMemo(() => generateMonthDays(currentMonth), [currentMonth]);
  
  // Calculate reservation lanes for each week
  const weekReservationLanes = useMemo(() => {
    return calculateReservationLanes(weeks, filteredReservations);
  }, [weeks, filteredReservations]);
  
  // Calculate block lanes for each week
  const weekBlockedLanes = useMemo(() => {
    return calculateBlockLanes(weeks, blockedReservations, 10);
  }, [weeks, blockedReservations]);
  
  // Calculate cell height based on maximum lanes
  const calculateCellHeight = () => {
    const maxLanes: { [key: number]: number } = {};
    
    weeks.forEach((_, weekIndex) => {
      const weekLanes = weekReservationLanes[weekIndex] || {};
      const blockLanes = weekBlockedLanes[weekIndex] || {};
      
      const maxRegularLane = Object.values(weekLanes).reduce((max, lane) => Math.max(max, lane), 0);
      const maxBlockLane = Object.values(blockLanes).reduce((max, lane) => Math.max(max, lane), 0);
      
      maxLanes[weekIndex] = Math.max(maxRegularLane, maxBlockLane - 10);
    });
    
    const maxLaneAcrossWeeks = Object.values(maxLanes).reduce((max, lane) => Math.max(max, lane), 0);
    const laneHeight = 14; // Height for each reservation lane
    const minCellHeight = 120; // Minimum height for calendar cells
    return Math.max(minCellHeight, 80 + (maxLaneAcrossWeeks * laneHeight));
  };
  
  const cellHeight = useMemo(() => calculateCellHeight(), [
    weekReservationLanes, 
    weekBlockedLanes
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
    weekBlockedLanes,
    nextMonth,
    prevMonth
  };
};
