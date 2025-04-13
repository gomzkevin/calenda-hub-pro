
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
  
  // Normalize the dates for consistent comparison
  const normalizedStartDate = normalizeDate(new Date(startDate));
  const normalizedEndDate = normalizeDate(new Date(endDate));
  
  // Find the exact position of the start and end days in this week
  for (let i = 0; i < week.length; i++) {
    const day = week[i];
    if (!day) continue;
    
    const normalizedDay = normalizeDate(day);
    
    // Check if this day is the start date or after it
    if (startPos === -1) {
      if (isSameDay(normalizedDay, normalizedStartDate)) {
        startPos = i;
      } else if (normalizedDay > normalizedStartDate) {
        startPos = i;
      }
    }
    
    // Check if this day is the end date
    if (isSameDay(normalizedDay, normalizedEndDate)) {
      endPos = i;
      break;
    }
    // If we're at the last day of the week and haven't found endPos,
    // but we know the reservation continues, set this as endPos
    else if (i === week.length - 1 && normalizedEndDate > normalizedDay && startPos !== -1) {
      endPos = i;
    }
  }
  
  // If we didn't find a starting position in this week, it's not in this week
  if (startPos === -1) {
    return { startPos: -1, endPos: -1, continuesFromPrevious: false, continuesToNext: false };
  }
  
  // If we found a starting position but no ending, use the end of the week
  if (endPos === -1 && startPos !== -1) {
    endPos = week.length - 1; // Last day of week
  }
  
  // Determine if the reservation continues from/to other weeks
  const firstDayOfWeek = normalizeDate(week[0]!);
  const lastDayOfWeek = normalizeDate(week[week.length - 1]!);
  
  // Check if check-in date is before the first day of the week or if it's on the first day
  const continuesFromPrevious = normalizedStartDate < firstDayOfWeek || 
                               (startPos === 0 && !isSameDay(firstDayOfWeek, normalizedStartDate));
  
  // Key fix: Only consider a reservation as "continuing to next" if the end date is AFTER the last day
  // This ensures that if a reservation ends exactly on the last day, it gets proper border radius
  const continuesToNext = normalizedEndDate > lastDayOfWeek && !isSameDay(normalizedEndDate, lastDayOfWeek);
  
  // Enhanced debugging for the last week
  console.log(`Week ${firstDayOfWeek.toDateString()} to ${lastDayOfWeek.toDateString()}, reservation ${normalizedStartDate.toDateString()} to ${normalizedEndDate.toDateString()}`);
  console.log(`startPos: ${startPos}, endPos: ${endPos}, continuesFromPrevious: ${continuesFromPrevious}, continuesToNext: ${continuesToNext}`);
  
  // Additional debug for the last week of the month
  if (endPos === week.length - 1) {
    console.log(`END-OF-WEEK: Last day=${lastDayOfWeek.toDateString()}, End date=${normalizedEndDate.toDateString()}, isSameDay=${isSameDay(lastDayOfWeek, normalizedEndDate)}, continuesToNext=${continuesToNext}`);
  }
  
  return { startPos, endPos, continuesFromPrevious, continuesToNext };
};
