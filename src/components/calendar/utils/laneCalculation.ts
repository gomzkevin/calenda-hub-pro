
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";
import { isSameDay, differenceInDays } from "date-fns";

/**
 * Calculate reservation lanes for proper vertical positioning
 * This function processes each week separately to ensure correct lane assignment
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Process each week independently
  weeks.forEach((week, weekIndex) => {
    // Skip weeks with no days
    if (!week[0]) {
      lanes[weekIndex] = {};
      return;
    }
    
    // Find reservations that belong to this week
    const weekReservations = reservations.filter(reservation => {
      // Check if any day in this week falls within the reservation period
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
      });
    });
    
    // Sort reservations by start date and then duration (for consistent lane assignment)
    weekReservations.sort((a, b) => {
      // First sort by start date
      if (a.startDate < b.startDate) return -1;
      if (a.startDate > b.startDate) return 1;
      
      // If same start date, sort by duration (longer first)
      const aDuration = differenceInDays(a.endDate, a.startDate);
      const bDuration = differenceInDays(b.endDate, b.startDate);
      
      return bDuration - aDuration;
    });
    
    // Assign lanes for this week
    const weekLanes: Record<string, number> = {};
    const occupiedLanes: boolean[] = [];
    
    weekReservations.forEach(reservation => {
      // Find the first available lane
      let laneIndex = 0;
      while (occupiedLanes[laneIndex]) {
        laneIndex++;
      }
      
      // Assign lane and mark as occupied for future reservations
      weekLanes[reservation.id] = laneIndex;
      occupiedLanes[laneIndex] = true;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};

/**
 * Calculate block lanes for proper vertical positioning
 * Similar logic to reservation lanes
 */
export const calculateBlockLanes = (
  weeks: (Date | null)[][],
  blocks: Reservation[] | undefined
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Early return if blocks is undefined or empty
  if (!blocks || blocks.length === 0) return lanes;
  
  // Process each week independently
  weeks.forEach((week, weekIndex) => {
    // Skip weeks with no days
    if (!week[0]) {
      lanes[weekIndex] = {};
      return;
    }
    
    // Find blocks that belong to this week
    const weekBlocks = blocks.filter(block => {
      // Check if any day in this week falls within the block period
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
      });
    });
    
    // Sort blocks by start date and then duration (for consistent lane assignment)
    weekBlocks.sort((a, b) => {
      // First sort by start date
      if (a.startDate < b.startDate) return -1;
      if (a.startDate > b.startDate) return 1;
      
      // If same start date, sort by duration (longer first)
      const aDuration = differenceInDays(a.endDate, a.startDate);
      const bDuration = differenceInDays(b.endDate, b.startDate);
      
      return bDuration - aDuration;
    });
    
    // Assign lanes for this week
    const weekLanes: Record<string, number> = {};
    const occupiedLanes: boolean[] = [];
    
    weekBlocks.forEach(block => {
      // Find the first available lane
      let laneIndex = 0;
      while (occupiedLanes[laneIndex]) {
        laneIndex++;
      }
      
      // Assign lane and mark as occupied for future blocks
      weekLanes[block.id] = laneIndex;
      occupiedLanes[laneIndex] = true;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
