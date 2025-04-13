
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
  // Modified calculation with adjusted offsets for check-in and check-out
  
  // Determine if this is a check-in or check-out day
  const isCheckInDay = !continuesFromPrevious;
  const isCheckOutDay = !continuesToNext;
  
  // Start position: if it continues from previous, start at 0
  // Otherwise start at 52% of the cell (for check-in) - leaving space for checkout
  const cellStartOffset = continuesFromPrevious ? 0 : 0.52;
  const adjustedStartPos = startPos + cellStartOffset;
  
  // End position: if it continues to next, end at full width
  // Otherwise end at 43% of the cell (for check-out) - leaving space for checkin
  const cellEndOffset = continuesToNext ? 1 : 0.43;
  const adjustedEndPos = endPos + cellEndOffset;
  
  // Calculate percentage values for positioning
  const barWidth = `${((adjustedEndPos - adjustedStartPos) / 7) * 100}%`;
  const barLeft = `${(adjustedStartPos / 7) * 100}%`;
  
  // Define border radius style - ensure last day of month gets proper rounding
  let borderRadiusStyle = 'rounded-none';
  
  // Check if this ends on the last day of the week
  const isLastDayOfWeek = endPos === 6;
  const isLastDayCheckOut = isLastDayOfWeek && !continuesToNext;
  
  // Single day reservations
  if (startPos === endPos && !continuesFromPrevious && !continuesToNext) {
    borderRadiusStyle = 'rounded-full';
  } 
  // First day of multi-day reservation
  else if (!continuesFromPrevious && continuesToNext) {
    borderRadiusStyle = 'rounded-l-lg rounded-r-none';
  } 
  // Last day of multi-day reservation
  else if (continuesFromPrevious && !continuesToNext) {
    borderRadiusStyle = 'rounded-r-lg rounded-l-none';
  }
  // Middle days of multi-day reservation
  else if (continuesFromPrevious && continuesToNext) {
    borderRadiusStyle = 'rounded-none';
  }
  // Special case: 2-day reservation within the same week
  else if (!continuesFromPrevious && !continuesToNext && startPos !== endPos) {
    borderRadiusStyle = 'rounded-l-lg rounded-r-lg';
  }
  
  // Debug information
  if (isLastDayCheckOut) {
    console.log(`Last day checkout detected: endPos=${endPos}, continuesToNext=${continuesToNext}, style=${borderRadiusStyle}`);
  }
  
  console.log(`Reservation from ${startDate} to ${endDate}: startPos=${startPos}, endPos=${endPos}, adjusted: ${adjustedStartPos}-${adjustedEndPos}`);
  console.log(`Border style: ${borderRadiusStyle}, continuesToNext: ${continuesToNext}`);
  
  return { barLeft, barWidth, borderRadiusStyle };
};
