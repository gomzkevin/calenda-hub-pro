
import { normalizeDate } from "./dateUtils";
import { isSameDay, isAfter, isBefore, addDays } from "date-fns";

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
  
  // Get valid days in the week (non-null)
  const validDays = week.filter(day => day !== null) as Date[];
  if (validDays.length === 0) {
    return { startPos: -1, endPos: -1, continuesFromPrevious: false, continuesToNext: false };
  }
  
  // Get the first and last days of the week for comparison
  const firstDayOfWeek = validDays[0];
  const lastDayOfWeek = validDays[validDays.length - 1];
  
  // Normalize all dates for consistent comparison
  const normalizedStartDate = normalizeDate(new Date(startDate));
  const normalizedEndDate = normalizeDate(new Date(endDate));
  const normalizedFirstDay = normalizeDate(new Date(firstDayOfWeek));
  const normalizedLastDay = normalizeDate(new Date(lastDayOfWeek));
  
  // Log actual date values for debugging
  console.log(`Reservation: ${normalizedStartDate.toLocaleDateString()} to ${normalizedEndDate.toLocaleDateString()}`);
  console.log(`Week: ${normalizedFirstDay.toLocaleDateString()} to ${normalizedLastDay.toLocaleDateString()}`);
  
  // Critical check: determine if this reservation overlaps with this week at all
  const weekOverlap = !(normalizedEndDate < normalizedFirstDay || normalizedStartDate > normalizedLastDay);
  
  if (!weekOverlap) {
    console.log("No overlap with this week - skipping");
    return { startPos: -1, endPos: -1, continuesFromPrevious: false, continuesToNext: false };
  }
  
  // Determine if reservation continues from previous week
  const continuesFromPrevious = isBefore(normalizedStartDate, normalizedFirstDay);
  
  // Determine if reservation continues to next week
  const continuesToNext = isAfter(normalizedEndDate, normalizedLastDay);
  
  // Find starting position
  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    if (!day) continue;
    
    const normalizedDay = normalizeDate(new Date(day));
    
    // If this day is on or after the reservation start date and we haven't found a position yet
    if ((isSameDay(normalizedDay, normalizedStartDate) || isAfter(normalizedDay, normalizedStartDate)) && startPos === -1) {
      startPos = i;
    }
    
    // If this day is on or before the reservation end date, update the end position
    if (isSameDay(normalizedDay, normalizedEndDate) || isBefore(normalizedDay, normalizedEndDate)) {
      endPos = i;
    }
    
    // If we've found both positions and we're past the end date, we can break early
    if (startPos !== -1 && endPos !== -1 && isAfter(normalizedDay, normalizedEndDate)) {
      break;
    }
  }
  
  // Handle edge cases
  
  // If reservation starts before this week but is in this week
  if (startPos === -1 && continuesFromPrevious && weekOverlap) {
    startPos = 0;
  }
  
  // If reservation ends after this week but is in this week
  if (endPos === -1 && continuesToNext && weekOverlap) {
    endPos = week.length - 1;
    for (let i = week.length - 1; i >= 0; i--) {
      if (week[i] !== null) {
        endPos = i;
        break;
      }
    }
  }
  
  // Handle single day reservations
  if (isSameDay(normalizedStartDate, normalizedEndDate)) {
    // Find the exact day in the week
    for (let i = 0; i < week.length; i++) {
      const day = week[i];
      if (!day) continue;
      
      if (isSameDay(normalizeDate(new Date(day)), normalizedStartDate)) {
        startPos = i;
        endPos = i;
        break;
      }
    }
  }
  
  console.log(`Final positions: startPos=${startPos}, endPos=${endPos}, continuesFromPrevious=${continuesFromPrevious}, continuesToNext=${continuesToNext}`);
  
  return { startPos, endPos, continuesFromPrevious, continuesToNext };
};
