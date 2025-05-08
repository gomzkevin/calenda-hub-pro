
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

/**
 * Simplified lane calculation with consistent lane assignment across weeks
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Global lane assignment (doesn't affect vertical positioning anymore)
  const globalLaneAssignment: Record<string, number> = {};
  
  // Assign global lanes to all reservations
  reservations.forEach((res, index) => {
    globalLaneAssignment[res.id] = 0; // All reservations use lane 0 for consistent vertical centering
  });
  
  // Process each week
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
  
  // Create a global lane assignment
  const globalLaneAssignment: Record<string, number> = {};
  
  // Pre-assign lanes to all blocks - all blocks get lane 0 for consistent vertical alignment
  blocks.forEach(block => {
    globalLaneAssignment[block.id] = 0;
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
