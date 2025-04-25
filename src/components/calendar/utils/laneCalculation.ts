
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
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    // Create a map to track occupied lanes for each day of the week
    const dayLaneMap: Record<number, boolean[]> = {};
    
    // Initialize occupied lane tracking for each day
    validDays.forEach((_, dayIndex) => {
      dayLaneMap[dayIndex] = [];
    });
    
    // Mejorado: Asignar lanes con un algoritmo de "mejor ajuste"
    weekReservations.forEach(reservation => {
      const normalizedStartDate = normalizeDate(new Date(reservation.startDate));
      const normalizedEndDate = normalizeDate(new Date(reservation.endDate));
      
      // Determinar días afectados
      const affectedDays: number[] = [];
      
      // Encontrar qué días de la semana están ocupados por esta reserva
      for (let dayIndex = 0; dayIndex < validDays.length; dayIndex++) {
        const currentDay = validDays[dayIndex];
        if (!currentDay) continue;
        
        const normalizedCurrentDay = normalizeDate(new Date(currentDay));
        
        // Check if this day is within the reservation period
        if (
          normalizedCurrentDay >= normalizedStartDate && 
          normalizedCurrentDay <= normalizedEndDate
        ) {
          affectedDays.push(dayIndex);
        }
      }
      
      if (affectedDays.length === 0) return;
      
      // Encontrar la primera lane disponible para todos los días afectados
      let laneToAssign = 0;
      let foundLane = false;
      
      while (!foundLane) {
        foundLane = true;
        
        // Check if current lane is available for all affected days
        for (const dayIndex of affectedDays) {
          if (dayLaneMap[dayIndex][laneToAssign]) {
            foundLane = false;
            break;
          }
        }
        
        if (!foundLane) {
          laneToAssign++;
          continue;
        }
        
        // Mark this lane as occupied for all affected days
        for (const dayIndex of affectedDays) {
          dayLaneMap[dayIndex][laneToAssign] = true;
        }
      }
      
      // Assign lane to reservation
      weekLanes[reservation.id] = laneToAssign;
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
 * Improved block lanes calculation with better overlap detection
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
    
    // Sort blocks by start date
    weekBlocks.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Create a map to track occupied lanes for each day of the week
    const dayLaneMap: Record<number, boolean[]> = {};
    
    // Initialize occupied lane tracking for each day
    validDays.forEach((_, dayIndex) => {
      dayLaneMap[dayIndex] = [];
    });
    
    // Mejorado: Asignar lanes con detección de superposición
    weekBlocks.forEach(block => {
      const normalizedStartDate = normalizeDate(new Date(block.startDate));
      const normalizedEndDate = normalizeDate(new Date(block.endDate));
      
      // Determinar días afectados
      const affectedDays: number[] = [];
      
      // Encontrar qué días de la semana están ocupados por este bloque
      for (let dayIndex = 0; dayIndex < validDays.length; dayIndex++) {
        const currentDay = validDays[dayIndex];
        if (!currentDay) continue;
        
        const normalizedCurrentDay = normalizeDate(new Date(currentDay));
        
        // Check if this day is within the block period
        if (
          normalizedCurrentDay >= normalizedStartDate && 
          normalizedCurrentDay <= normalizedEndDate
        ) {
          affectedDays.push(dayIndex);
        }
      }
      
      if (affectedDays.length === 0) return;
      
      // Encontrar la primera lane disponible para todos los días afectados
      let laneToAssign = 0;
      let foundLane = false;
      
      while (!foundLane) {
        foundLane = true;
        
        // Check if current lane is available for all affected days
        for (const dayIndex of affectedDays) {
          if (dayLaneMap[dayIndex][laneToAssign]) {
            foundLane = false;
            break;
          }
        }
        
        if (!foundLane) {
          laneToAssign++;
          continue;
        }
        
        // Mark this lane as occupied for all affected days
        for (const dayIndex of affectedDays) {
          dayLaneMap[dayIndex][laneToAssign] = true;
        }
      }
      
      // Assign lane to block
      weekLanes[block.id] = laneToAssign;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
