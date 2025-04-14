
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
  
  // Filter out null values from the week
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
  
  // Determine if reservation continues from previous week
  const continuesFromPrevious = isBefore(normalizedStartDate, normalizedFirstDay);
  
  // Determine if reservation continues to next week
  const continuesToNext = isAfter(normalizedEndDate, normalizedLastDay);
  
  // Find the position of the start date in this week
  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    if (!day) continue;
    
    const normalizedDay = normalizeDate(new Date(day));
    
    // If this day is the start date or later than start date (and we haven't found startPos yet)
    if (isSameDay(normalizedDay, normalizedStartDate) || 
        (startPos === -1 && isAfter(normalizedDay, normalizedStartDate))) {
      startPos = i;
    }
    
    // If this day is the end date or the day before (since checkout is typically morning)
    if (isSameDay(normalizedDay, normalizedEndDate)) {
      endPos = i;
      break;
    }
    
    // If we're at the last day and still haven't found endPos, but we know the reservation continues
    if (i === week.length - 1 && normalizedEndDate > normalizedDay && startPos !== -1) {
      endPos = i;
    }
  }
  
  // If the reservation starts before this week but is in this week
  if (startPos === -1 && continuesFromPrevious) {
    startPos = 0;
  }
  
  // If we found a starting position but no ending, it continues to next week
  if (endPos === -1 && startPos !== -1) {
    endPos = 6; // Last day of week
  }
  
  console.log(`Final positions: startPos=${startPos}, endPos=${endPos}, continuesFromPrevious=${continuesFromPrevious}, continuesToNext=${continuesToNext}`);
  
  return { startPos, endPos, continuesFromPrevious, continuesToNext };
};
