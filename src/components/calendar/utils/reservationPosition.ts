
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
  // Use clone to ensure we're not modifying original dates
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
  
  // Check if the reservation overlaps with this week
  const reservationStartsBeforeWeekEnds = isSameDay(normalizedStartDate, normalizedLastDay) || isBefore(normalizedStartDate, normalizedLastDay);
  const reservationEndsAfterWeekStarts = isSameDay(normalizedEndDate, normalizedFirstDay) || isAfter(normalizedEndDate, normalizedFirstDay);
  
  const hasOverlap = reservationStartsBeforeWeekEnds && reservationEndsAfterWeekStarts;
  
  if (!hasOverlap) {
    console.log("No overlap with this week - skipping");
    return { startPos: -1, endPos: -1, continuesFromPrevious: false, continuesToNext: false };
  }
  
  // Find starting position - check each day in the week
  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    if (!day) continue;
    
    const normalizedDay = normalizeDate(new Date(day));
    
    // If this day is the start date or we've passed the start date
    if (isSameDay(normalizedDay, normalizedStartDate) || 
        (isAfter(normalizedDay, normalizedStartDate) && startPos === -1)) {
      startPos = i;
      break;
    }
  }
  
  // If the reservation starts before this week
  if (startPos === -1 && continuesFromPrevious) {
    // Find the first valid day in the week
    for (let i = 0; i < week.length; i++) {
      if (week[i] !== null) {
        startPos = i;
        break;
      }
    }
  }
  
  // Find ending position - examine each day from the end of the week backward
  for (let i = week.length - 1; i >= 0; i--) {
    const day = week[i];
    if (!day) continue;
    
    const normalizedDay = normalizeDate(new Date(day));
    
    // If this day is the end date or earlier than the end date
    if (isSameDay(normalizedDay, normalizedEndDate) || 
        (isBefore(normalizedDay, normalizedEndDate) && endPos === -1)) {
      endPos = i;
      break;
    }
  }
  
  // If the reservation ends after this week
  if (endPos === -1 && continuesToNext) {
    // Find the last valid day in the week
    for (let i = week.length - 1; i >= 0; i--) {
      if (week[i] !== null) {
        endPos = i;
        break;
      }
    }
  }
  
  console.log(`Final positions: startPos=${startPos}, endPos=${endPos}, continuesFromPrevious=${continuesFromPrevious}, continuesToNext=${continuesToNext}`);
  
  return { startPos, endPos, continuesFromPrevious, continuesToNext };
};
