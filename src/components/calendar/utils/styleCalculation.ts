
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
  
  // Adjust based on neighboring reservations - CRITICAL for propagated blocks
  const hasNeighborAtStart = neighboringReservation.hasNeighborStart === true;
  const hasNeighborAtEnd = neighboringReservation.hasNeighborEnd === true;
  
  console.log(`Has neighbor at start: ${hasNeighborAtStart}, at end: ${hasNeighborAtEnd}`);
  
  // Calculate cell width percentages with room for check-in/out visual separation
  // IMPROVED: For propagated blocks, we need to ensure they have rounded edges when meeting reservations
  let cellStartOffset = 0;
  let cellEndOffset = 0;
  
  // Default behavior for regular reservations
  if (!forceContinuous && !hasNeighborAtStart) {
    // If it's the start of a reservation or has a block next to it, add start offset
    cellStartOffset = continuesFromPrevious ? 0 : 0.52;
  } else if (hasNeighborAtStart) {
    // Force rounded beginning if there's a neighbor at start
    cellStartOffset = 0.52;
  }
  
  if (!forceContinuous && !hasNeighborAtEnd) {
    // If it's the end of a reservation or has a block next to it, add end offset
    cellEndOffset = continuesToNext ? 1 : 0.48;
  } else if (hasNeighborAtEnd) {
    // Force rounded end if there's a neighbor at end
    cellEndOffset = 0.48;
  } else {
    cellEndOffset = 1;
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
  // Multiple day reservation or propagated block
  else {
    // IMPROVED: Consider neighboring reservations for border radius
    if (!continuesFromPrevious || hasNeighborAtStart) {
      borderRadiusStyle = borderRadiusStyle + ' rounded-l-lg';
      console.log('Adding rounded-l-lg due to start condition or neighbor');
    }
    
    if (!continuesToNext || hasNeighborAtEnd) {
      borderRadiusStyle = borderRadiusStyle + ' rounded-r-lg';
      console.log('Adding rounded-r-lg due to end condition or neighbor');
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
