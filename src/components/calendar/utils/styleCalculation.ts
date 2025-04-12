
import { isSameDay } from "date-fns";
import { normalizeDate } from "./dateUtils";

/**
 * Calculate bar position and width
 */
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
