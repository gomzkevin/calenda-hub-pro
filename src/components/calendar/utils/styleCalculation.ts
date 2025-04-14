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
  // Otherwise end at 48% of the cell (for check-out) - leaving space for checkin
  const cellEndOffset = continuesToNext ? 1 : 0.48;
  const adjustedEndPos = endPos + cellEndOffset;
  
  // Calculate percentage values for positioning
  const barWidth = `${((adjustedEndPos - adjustedStartPos) / 7) * 100}%`;
  const barLeft = `${(adjustedStartPos / 7) * 100}%`;
  
  // Define border radius style 
  let borderRadiusStyle = 'rounded-none';
  
  // Special handling for single day reservation
  if (isSameDay(normalizeDate(startDate), normalizeDate(endDate))) {
    borderRadiusStyle = 'rounded-full';
  } 
  // Special handling for reservation that spans one night (two days)
  else if (
    !continuesFromPrevious && 
    !continuesToNext && 
    endPos - startPos === 1
  ) {
    borderRadiusStyle = 'rounded-lg';
  }
  // Multiple day reservation
  else {
    if (!continuesFromPrevious) {
      borderRadiusStyle = borderRadiusStyle + ' rounded-l-lg';
    }
    
    if (!continuesToNext) {
      borderRadiusStyle = borderRadiusStyle + ' rounded-r-lg';
    }
    
    // Clean up the style if needed
    borderRadiusStyle = borderRadiusStyle.trim();
    if (borderRadiusStyle === 'rounded-none rounded-l-lg rounded-r-lg') {
      borderRadiusStyle = 'rounded-lg';
    } else if (borderRadiusStyle === 'rounded-none') {
      borderRadiusStyle = '';
    }
  }
  
  // Add debug logs
  console.log(`Reservation from ${startDate} to ${endDate}: startPos=${startPos}, endPos=${endPos}, adjusted: ${adjustedStartPos}-${adjustedEndPos}`);
  console.log(`Border style: ${borderRadiusStyle}, continuesToNext: ${continuesToNext}, isLastDayOfWeek: ${endPos === 6}`);
  
  return { barLeft, barWidth, borderRadiusStyle };
};
