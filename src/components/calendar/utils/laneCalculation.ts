
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

/**
 * Improved lane calculation with better week-specific assignment to ensure consistent positioning
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    const usedLanes: boolean[] = []; // Track which lanes are used in this week
    
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
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    // Assign lanes based on priority and ensure consistent lane assignment
    weekReservations.forEach(reservation => {
      // For regular reservations, start with lane 0
      let lane = 0;
      
      // Find the first available lane (not used by another reservation)
      while (usedLanes[lane]) {
        lane++;
      }
      
      // Mark this lane as used
      usedLanes[lane] = true;
      
      // Assign the lane to this reservation
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
 * Simplified block lanes calculation with improved positioning
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
    const usedLanes: boolean[] = []; // Track which lanes are used in this week
    
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
    
    // Sort blocks by start date for consistent lane assignment
    weekBlocks.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Assign lanes with proper spacing for each block
    weekBlocks.forEach(block => {
      // Find the first available lane
      let lane = 0;
      while (usedLanes[lane]) {
        lane++;
      }
      
      // Mark this lane as used
      usedLanes[lane] = true;
      
      // Assign the lane
      weekLanes[block.id] = lane;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
