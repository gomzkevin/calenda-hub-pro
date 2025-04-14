
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";
import { isSameDay, differenceInDays } from "date-fns";

/**
 * Simplified lane calculation - always uses a single lane (0)
 * This replaces the previous complex lane calculation logic
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
    
    // In our simplified approach, all reservations get lane 0
    weekReservations.forEach(reservation => {
      weekLanes[reservation.id] = 0;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};

/**
 * Simplified block lanes - always uses a single lane (0)
 * This replaces the previous complex block lane calculation
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
      return week.some(day => {
        if (!day) return false;
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= block.endDate && normalizedDay >= block.startDate;
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
