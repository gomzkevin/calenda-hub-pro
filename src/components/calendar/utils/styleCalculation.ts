
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
  
  // Special case: Last day of week/month handling
  const isLastDayOfWeek = endPos === 6;
  
  // Determine the correct border radius based on reservation position
  if (startPos === endPos && !continuesFromPrevious && !continuesToNext) {
    // Single day reservation (check-in and check-out on same day)
    borderRadiusStyle = 'rounded-full';
  } 
  else if (!continuesFromPrevious && !continuesToNext) {
    // Multi-day reservation that starts and ends within the same week (not continuing)
    borderRadiusStyle = 'rounded-l-lg rounded-r-lg';
  }
  else if (!continuesFromPrevious && continuesToNext) {
    // First day of multi-day reservation that continues to next week
    borderRadiusStyle = 'rounded-l-lg rounded-r-none';
  } 
  else if (continuesFromPrevious && !continuesToNext) {
    // Last day of multi-day reservation (critical for last week of month)
    borderRadiusStyle = 'rounded-r-lg rounded-l-none';
  }
  else if (continuesFromPrevious && continuesToNext) {
    // Middle days of multi-day reservation
    borderRadiusStyle = 'rounded-none';
  }
  
  // Force debug information for all reservations ending on last day
  if (isLastDayOfWeek) {
    console.log(`Last day reservation: endPos=${endPos}, continuesToNext=${continuesToNext}, style=${borderRadiusStyle}`);
  }
  
  console.log(`Reservation from ${startDate} to ${endDate}: startPos=${startPos}, endPos=${endPos}, adjusted: ${adjustedStartPos}-${adjustedEndPos}`);
  console.log(`Border style: ${borderRadiusStyle}, continuesToNext: ${continuesToNext}`);
  
  return { barLeft, barWidth, borderRadiusStyle };
};
