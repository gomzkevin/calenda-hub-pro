
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
  
  // Calculate offsets based on whether we're at the start/end of a reservation
  // and whether there are neighboring blocks
  
  // Start offset calculation
  if (hasNeighborAtStart) {
    // If there's a neighbor at the start, force rounded beginning
    cellStartOffset = 0.52;
    console.log("Setting rounded start due to neighbor");
  } else if (!forceContinuous && !continuesFromPrevious) {
    // If it's the start of a regular reservation, add start offset
    cellStartOffset = 0.52;
    console.log("Setting rounded start due to reservation beginning");
  }
  
  // End offset calculation
  if (hasNeighborAtEnd) {
    // If there's a neighbor at the end, force rounded end (and only go up to 48% of the cell)
    cellEndOffset = 0.48;
    console.log("Setting rounded end due to neighbor");
  } else if (!forceContinuous && !continuesToNext) {
    // If it's the end of a regular reservation, add end offset
    cellEndOffset = 0.48;
    console.log("Setting rounded end due to reservation ending");
  } else {
    // If it continues to next day
    cellEndOffset = 1;
    console.log("Setting full end due to continuation");
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
    // Critical improvement: Consider neighboring reservations for border radius
    // This is essential for propagated blocks that meet reservations
    
    // Start border radius
    if (!continuesFromPrevious || hasNeighborAtStart) {
      borderRadiusStyle = borderRadiusStyle + ' rounded-l-lg';
      console.log('Adding rounded-l-lg due to start condition or neighbor');
    }
    
    // End border radius
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
