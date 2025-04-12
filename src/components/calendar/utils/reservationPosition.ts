
import { normalizeDate } from "./dateUtils";
import { isSameDay } from "date-fns";

/**
 * Find positions for a reservation in a week
 */
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
