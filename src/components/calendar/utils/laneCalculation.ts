import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

/**
 * Improved lane calculation with better week-specific filtering and priority lanes
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    
    // Get valid week start and end days
    const validDays = week.filter(day => day !== null) as Date[];
    if (validDays.length === 0) {
      lanes[weekIndex] = {};
      return;
    }
    
    const firstDayOfWeek = validDays[0];
    const lastDayOfWeek = validDays[validDays.length - 1];
    
    const normalizedFirstDay = normalizeDate(new Date(firstDayOfWeek));
    const normalizedLastDay = normalizeDate(new Date(lastDayOfWeek));
    
    // Filter reservations that overlap with this week
    let weekReservations = reservations.filter(reservation => {
      const normalizedStartDate = normalizeDate(new Date(reservation.startDate));
      const normalizedEndDate = normalizeDate(new Date(reservation.endDate));
      
      // Check if reservation intersects with week
      return normalizedStartDate <= normalizedLastDay && normalizedEndDate >= normalizedFirstDay;
    });
    
    // Sort reservations by priority and then by start date
    weekReservations.sort((a, b) => {
      // First compare by priority type
      const aPriority = getPriorityValue(a);
      const bPriority = getPriorityValue(b);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by start date
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    });
    
    // Assign lanes based on priority and overlapping
    weekReservations.forEach(reservation => {
      const lane = getPriorityValue(reservation);
      weekLanes[reservation.id] = lane;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};

// Helper function to determine reservation priority
const getPriorityValue = (reservation: Reservation): number => {
  // Regular reservations get top priority (lane 0)
  if (!reservation.sourceReservationId && !reservation.isBlocking) {
    return 0;
  }
  
  // Parent-child relationship blocks get second priority (lane 1)
  if (reservation.isRelationshipBlock) {
    return 1;
  }
  
  // Propagated blocks get lowest priority (lane 2)
  if (reservation.sourceReservationId || reservation.isBlocking) {
    return 2;
  }
  
  return 0; // Default to top priority if unknown
};

/**
 * Simplified block lanes calculation
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
    
    // Get valid week start and end days
    const validDays = week.filter(day => day !== null) as Date[];
    if (validDays.length === 0) {
      lanes[weekIndex] = {};
      return;
    }
    
    const firstDayOfWeek = validDays[0];
    const lastDayOfWeek = validDays[validDays.length - 1];
    
    const normalizedFirstDay = normalizeDate(new Date(firstDayOfWeek));
    const normalizedLastDay = normalizeDate(new Date(lastDayOfWeek));
    
    // Filter blocks that overlap with this week
    const weekBlocks = blocks.filter(block => {
      const normalizedStartDate = normalizeDate(new Date(block.startDate));
      const normalizedEndDate = normalizeDate(new Date(block.endDate));
      
      // Check if block intersects with week
      return normalizedStartDate <= normalizedLastDay && normalizedEndDate >= normalizedFirstDay;
    });
    
    // All blocks get lane 0 in our simplified approach
    weekBlocks.forEach(block => {
      weekLanes[block.id] = 0;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
