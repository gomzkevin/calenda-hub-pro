
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
  forceContinuous: boolean = false,
  neighboringReservation: {
    hasNeighborStart?: boolean;
    hasNeighborEnd?: boolean;
  } = {}
): { barLeft: string, barWidth: string, borderRadiusStyle: string } => {
  // Debug current values
  console.log(`Style calculation for positions: startPos=${startPos}, endPos=${endPos}`);
  console.log(`continuesToNext=${continuesToNext}, continuesFromPrevious=${continuesFromPrevious}`);
  console.log(`forceContinuous=${forceContinuous}`);
  console.log(`neighboringReservation=`, neighboringReservation);
  
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
  
  // Adjust based on neighboring reservations - this is the key for propagated blocks
  const hasNeighborAtStart = neighboringReservation.hasNeighborStart || false;
  const hasNeighborAtEnd = neighboringReservation.hasNeighborEnd || false;
  
  // Calculate cell width percentages with room for check-in/out visual separation
  let cellStartOffset = forceContinuous ? 0 : (continuesFromPrevious ? 0 : 0.52);
  let cellEndOffset = forceContinuous ? 1 : (continuesToNext ? 1 : 0.48);
  
  // Special handling for neighboring reservations
  if (hasNeighborAtStart) {
    cellStartOffset = 0.52; // Force rounded beginning if there's a neighbor at start
  }
  
  if (hasNeighborAtEnd) {
    cellEndOffset = 0.48; // Force rounded end if there's a neighbor at end
  }
  
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
  
  // If forceContinuous and no neighbors, always use no radius
  if (forceContinuous && !hasNeighborAtStart && !hasNeighborAtEnd) {
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
      // Apply rounded left if it's the start or has a neighbor at start
      if (!continuesFromPrevious || hasNeighborAtStart) {
        borderRadiusStyle = borderRadiusStyle + ' rounded-l-lg';
      }
      
      // Apply rounded right if it's the end or has a neighbor at end
      if (!continuesToNext || hasNeighborAtEnd) {
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
