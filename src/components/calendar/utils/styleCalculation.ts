
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
  endDate: Date,
  forceContinuous: boolean = false
): { barLeft: string, barWidth: string, borderRadiusStyle: string } => {
  // Debug current values
  console.log(`Style calculation for positions: startPos=${startPos}, endPos=${endPos}`);
  console.log(`continuesToNext=${continuesToNext}, continuesFromPrevious=${continuesFromPrevious}`);
  console.log(`forceContinuous=${forceContinuous}`);
  
  // Ensure positions are valid
  if (startPos === -1 || endPos === -1) {
    console.log('Invalid positions for bar calculation');
    return { barLeft: '0%', barWidth: '0%', borderRadiusStyle: '' };
  }
  
  // For cases where startPos > endPos, adjust to ensure proper rendering
  if (startPos > endPos) {
    console.log('Correcting invalid positions (startPos > endPos)');
    return { barLeft: '0%', barWidth: '0%', borderRadiusStyle: '' };
  }
  
  // Determine if this is a check-in or check-out day
  // If forceContinuous is true, treat as part of continuous stay
  const isCheckInDay = forceContinuous ? false : !continuesFromPrevious;
  const isCheckOutDay = forceContinuous ? false : !continuesToNext;
  
  // Calculate cell width percentages with room for check-in/out visual separation
  // If forceContinuous is true, no offsets
  const cellStartOffset = forceContinuous ? 0 : (continuesFromPrevious ? 0 : 0.52);
  const cellEndOffset = forceContinuous ? 1 : (continuesToNext ? 1 : 0.48);
  
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
  
  // If forceContinuous, always use no radius
  if (forceContinuous) {
    borderRadiusStyle = 'rounded-none';
    console.log('Forced continuous segment - using no rounding');
  } else {
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
  }
  
  return { barLeft, barWidth, borderRadiusStyle };
};
