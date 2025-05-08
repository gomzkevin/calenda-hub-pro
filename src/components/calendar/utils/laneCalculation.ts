
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

/**
 * Improved lane calculation with consistent lane assignment
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // First, identify all unique reservation IDs that appear across all weeks
  const allReservationIds = new Set<string>();
  reservations.forEach(res => allReservationIds.add(res.id));
  
  // Create a global lane assignment for consistency across weeks
  const globalLaneAssignment: Record<string, number> = {};
  let nextLane = 0;
  
  // Pre-assign lanes to all reservations based on priority
  const sortedReservations = [...reservations].sort((a, b) => {
    // First compare by priority type
    const aPriority = getPriorityValue(a);
    const bPriority = getPriorityValue(b);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort by start date
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  
  // Assign global lanes
  sortedReservations.forEach(res => {
    if (!globalLaneAssignment[res.id]) {
      globalLaneAssignment[res.id] = nextLane;
      nextLane++;
    }
  });
  
  // Now process each week using the global lane assignments
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
    const weekReservations = reservations.filter(reservation => {
      const normalizedStartDate = normalizeDate(new Date(reservation.startDate));
      const normalizedEndDate = normalizeDate(new Date(reservation.endDate));
      
      // Check if reservation intersects with week
      return normalizedStartDate <= normalizedLastDay && normalizedEndDate >= normalizedFirstDay;
    });
    
    // Apply global lane assignments to this week
    weekReservations.forEach(res => {
      weekLanes[res.id] = globalLaneAssignment[res.id];
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
 * Simplified block lanes calculation with consistent global lane assignment
 */
export const calculateBlockLanes = (
  weeks: (Date | null)[][],
  blocks: Reservation[] | undefined
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Early return if blocks is undefined or empty
  if (!blocks || blocks.length === 0) return lanes;
  
  // Create a global lane assignment for consistency across weeks
  const globalLaneAssignment: Record<string, number> = {};
  let nextLane = 0;
  
  // Pre-assign lanes to all blocks
  const sortedBlocks = [...blocks].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  sortedBlocks.forEach(block => {
    if (!globalLaneAssignment[block.id]) {
      globalLaneAssignment[block.id] = nextLane;
      nextLane++;
    }
  });
  
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
    
    // Apply global lane assignments to this week
    weekBlocks.forEach(block => {
      weekLanes[block.id] = globalLaneAssignment[block.id];
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
