
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";
import { differenceInDays, isSameDay } from "date-fns";

// Calculate reservation lanes for each week
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

// Calculate block lanes (propagated or relationship blocks)
export const calculateBlockLanes = (
  weeks: (Date | null)[][],
  blocks: Reservation[],
  baseLane: number = 10
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  if (blocks.length === 0) return lanes;
  
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

// Find positions for a reservation in a week
export const findReservationPositionInWeek = (
  week: (Date | null)[],
  startDate: Date,
  endDate: Date
): { startPos: number, endPos: number, continuesFromPrevious: boolean, continuesToNext: boolean } => {
  let startPos = -1;
  let endPos = -1;
  
  // Find the exact position of the start and end days in this week
  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    if (!day) continue;
    
    const normalizedDay = normalizeDate(day);
    
    // Check if this day is the start date or after it
    if (startPos === -1) {
      if (isSameDay(normalizedDay, startDate)) {
        startPos = i;
      } else if (normalizedDay > startDate) {
        startPos = i;
      }
    }
    
    // Check if this day is the end date
    if (isSameDay(normalizedDay, endDate)) {
      endPos = i;
      break;
    }
    // If we're at the last day of the week and haven't found endPos,
    // but we know the reservation continues, set this as endPos
    else if (i === week.length - 1 && endDate > normalizedDay && startPos !== -1) {
      endPos = i;
    }
  }
  
  // If we didn't find a starting position in this week, it's not in this week
  if (startPos === -1) {
    return { startPos: -1, endPos: -1, continuesFromPrevious: false, continuesToNext: false };
  }
  
  // If we found a starting position but no ending, use the end of the week
  if (endPos === -1 && startPos !== -1) {
    endPos = 6; // Last day of week
  }
  
  // Determine if the reservation continues from/to other weeks
  const continuesFromPrevious = startPos === 0 && !isSameDay(normalizeDate(week[0]!), startDate);
  const continuesToNext = endPos === 6 && !isSameDay(normalizeDate(week[6]!), endDate);
  
  return { startPos, endPos, continuesFromPrevious, continuesToNext };
};

// Calculate bar position and width
export const calculateBarPositionAndStyle = (
  startPos: number,
  endPos: number,
  continuesFromPrevious: boolean,
  continuesToNext: boolean,
  week: (Date | null)[],
  startDate: Date, 
  endDate: Date
): { barLeft: string, barWidth: string, borderRadiusStyle: string } => {
  let barStartPos = startPos;
  let barEndPos = endPos;
  
  // If this is the actual check-in day, start at 60% of the cell
  if (week[startPos] && isSameDay(normalizeDate(week[startPos]!), startDate)) {
    barStartPos += 0.6; // Start at 60% of the cell width
  }
  
  // If this is the actual check-out day, end at 40% of the cell
  if (week[endPos] && isSameDay(normalizeDate(week[endPos]!), endDate)) {
    barEndPos += 0.4; // End at 40% of the cell width
  } else {
    // If not the actual check-out day, bar should extend to the end of the day
    barEndPos += 1;
  }
  
  const barWidth = `${((barEndPos - barStartPos) / 7) * 100}%`;
  const barLeft = `${(barStartPos / 7) * 100}%`;
  
  // Define border radius style based on if the reservation continues
  let borderRadiusStyle = 'rounded-full';
  if (continuesFromPrevious && continuesToNext) {
    borderRadiusStyle = 'rounded-none';
  } else if (continuesFromPrevious) {
    borderRadiusStyle = 'rounded-r-full rounded-l-none';
  } else if (continuesToNext) {
    borderRadiusStyle = 'rounded-l-full rounded-r-none';
  }
  
  return { barLeft, barWidth, borderRadiusStyle };
};
