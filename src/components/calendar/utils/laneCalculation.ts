
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";
import { isSameDay, differenceInDays } from "date-fns";

/**
 * Calculate reservation lanes for each week
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    
    // Filter reservations that overlap with this week
    let weekReservations = reservations.filter(reservation => {
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
      });
    });
    
    // Sort reservations by start date to ensure consistent lane assignment
    const sortedReservations = [...weekReservations].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
    
    // Enhanced lane assignment strategy to prioritize consecutive reservations in same lane
    sortedReservations.forEach((reservation, index) => {
      const resId = reservation.id;
      
      // Check if this reservation follows the previous one (consecutive or close)
      if (index > 0) {
        const prevReservation = sortedReservations[index-1];
        const prevResId = prevReservation.id;
        
        // If this reservation starts on the same day the previous one ends or within 3 days
        const daysBetween = differenceInDays(reservation.startDate, prevReservation.endDate);
        if (isSameDay(prevReservation.endDate, reservation.startDate) || 
            (daysBetween >= 0 && daysBetween <= 3)) {
          
          // Try to assign the same lane as the previous reservation
          const prevLane = weekLanes[prevResId];
          
          // Check if this lane is available for the current reservation
          let canUseSameLane = true;
          
          // Check for conflicts with other reservations in this lane
          for (const existingResId in weekLanes) {
            if (existingResId === prevResId) continue;
            if (weekLanes[existingResId] !== prevLane) continue;
            
            const existingRes = weekReservations.find(r => r.id === existingResId);
            if (!existingRes) continue;
            
            // Check for date overlap
            if (reservation.startDate <= existingRes.endDate && 
                reservation.endDate >= existingRes.startDate) {
              canUseSameLane = false;
              break;
            }
          }
          
          if (canUseSameLane) {
            weekLanes[resId] = prevLane;
            return;
          }
        }
      }
      
      // If we couldn't reuse the previous lane, find the first available lane
      let lane = 0;
      let laneFound = false;
      
      while (!laneFound) {
        laneFound = true;
        
        // Check if any existing reservation in this lane overlaps with current reservation
        for (const existingResId in weekLanes) {
          const existingLane = weekLanes[existingResId];
          if (existingLane !== lane) continue;
          
          const existingRes = weekReservations.find(r => r.id === existingResId);
          if (!existingRes) continue;
          
          // Check for date overlap
          if (reservation.startDate <= existingRes.endDate && 
              reservation.endDate >= existingRes.startDate) {
            laneFound = false;
            break;
          }
        }
        
        if (!laneFound) {
          lane++;
        }
      }
      
      // Assign this lane to the reservation
      weekLanes[resId] = lane;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};

/**
 * Calculate block lanes (propagated or relationship blocks)
 */
export const calculateBlockLanes = (
  weeks: (Date | null)[][],
  blocks: Reservation[] | undefined,
  baseLane: number = 10
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Early return if blocks is undefined or empty
  if (!blocks || blocks.length === 0) return lanes;
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    
    // Filter blocks that overlap with this week
    const weekBlocks = blocks.filter(block => {
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
      });
    });
    
    // Sort blocks by start date
    const sortedBlocks = [...weekBlocks].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
    
    // Assign lanes
    sortedBlocks.forEach((block, index) => {
      weekLanes[block.id] = baseLane + index;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
