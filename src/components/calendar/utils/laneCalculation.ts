
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

/**
 * Improved lane calculation with better week-specific filtering
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
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= endDate && normalizedDay >= startDate;
      });
    });
    
    // Sort reservations by start date to optimize lane assignment
    weekReservations.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // In our simplified approach, all reservations get lane 0
    weekReservations.forEach(reservation => {
      weekLanes[reservation.id] = 0;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};

/**
 * Simplified block lanes with improved week-specific filtering
 */
export const calculateBlockLanes = (
  weeks: (Date | null)[][],
  blocks: Reservation[] | undefined
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Early return if blocks is undefined or empty
  if (!blocks || blocks.length === 0) return lanes;
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    
    // Filter blocks that overlap with this week
    const weekBlocks = blocks.filter(block => {
      const startDate = new Date(block.startDate);
      const endDate = new Date(block.endDate);
      
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= endDate && normalizedDay >= startDate;
      });
    });
    
    // All blocks get lane 0 in our simplified approach
    weekBlocks.forEach(block => {
      weekLanes[block.id] = 0;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
