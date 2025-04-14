
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
  // Debug current values
  console.log(`Style calculation for positions: startPos=${startPos}, endPos=${endPos}`);
  console.log(`continuesToNext=${continuesToNext}, continuesFromPrevious=${continuesFromPrevious}`);
  
  // Make sure startPos and endPos are valid - fallback to safe values
  if (startPos < 0) startPos = 0;
  if (endPos < 0) endPos = 0;
  if (endPos >= week.length) endPos = week.length - 1;
  if (startPos > endPos) startPos = endPos;
  
  // Determine if this is a check-in or check-out day
  const isCheckInDay = !continuesFromPrevious;
  const isCheckOutDay = !continuesToNext;
  
  // Calculate cell width percentages with room for check-in/out visual separation
  const cellStartOffset = continuesFromPrevious ? 0 : 0.52;
  const cellEndOffset = continuesToNext ? 1 : 0.48;
  
  // Apply offsets
  const adjustedStartPos = startPos + cellStartOffset;
  const adjustedEndPos = endPos + cellEndOffset;
  
  // Calculate percentage values for positioning
  const barWidth = `${((adjustedEndPos - adjustedStartPos) / 7) * 100}%`;
  const barLeft = `${(adjustedStartPos / 7) * 100}%`;
  
  console.log(`Adjusted positions: start=${adjustedStartPos}, end=${adjustedEndPos}`);
  console.log(`Bar styling: width=${barWidth}, left=${barLeft}`);
  
  // Define border radius style 
  let borderRadiusStyle = 'rounded-none';
  
  // Normalize dates for comparison
  const normalizedStartDate = normalizeDate(new Date(startDate));
  const normalizedEndDate = normalizeDate(new Date(endDate));
  
  // Special handling for single day reservation (same day check-in and check-out)
  if (isSameDay(normalizedStartDate, normalizedEndDate)) {
    borderRadiusStyle = 'rounded-full';
    console.log('Single day reservation - using rounded-full');
  } 
  // Special handling for reservation that spans one night (two days)
  else if (
    !continuesFromPrevious && 
    !continuesToNext && 
    (endPos - startPos === 1 || (startPos === endPos && !isSameDay(normalizedStartDate, normalizedEndDate)))
  ) {
    borderRadiusStyle = 'rounded-lg';
    console.log('Two-day reservation - using rounded-lg');
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
    
    console.log(`Multiple day reservation - using ${borderRadiusStyle}`);
  }
  
  return { barLeft, barWidth, borderRadiusStyle };
};
