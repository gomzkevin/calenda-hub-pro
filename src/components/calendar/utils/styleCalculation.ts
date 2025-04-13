
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
  // Modified calculation to start at 45% of first cell and end at 45% of last cell
  // This creates spacing between checkout and checkin on the same day
  
  // Start position: if it continues from previous, start at 0, otherwise start at 45% of the cell
  const cellStartOffset = continuesFromPrevious ? 0 : 0.45;
  const adjustedStartPos = startPos + cellStartOffset;
  
  // End position: if it continues to next, end at full width, otherwise end at 45% of the cell
  const cellEndOffset = continuesToNext ? 1 : 0.45;
  const adjustedEndPos = endPos + cellEndOffset;
  
  // Add a small gap of 0.05 between lanes on the same day
  const sameDay = week.some(day => 
    day && isSameDay(normalizeDate(day), normalizeDate(startDate)) && 
    isSameDay(normalizeDate(day), normalizeDate(endDate))
  );
  
  // Adjust positions to create a small gap for same-day events
  const gapAdjustment = sameDay ? 0.05 : 0;
  
  // Calculate percentage values for positioning
  const barWidth = `${((adjustedEndPos - adjustedStartPos - gapAdjustment) / 7) * 100}%`;
  const barLeft = `${((adjustedStartPos + (sameDay ? gapAdjustment / 2 : 0)) / 7) * 100}%`;
  
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

