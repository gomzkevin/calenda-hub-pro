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
  isPropagatedBlock: boolean = false,
  isOriginalBlock: boolean = false
): { barLeft: string, barWidth: string, borderRadiusStyle: string } => {
  // Debug current values
  console.log(`Style calculation for positions: startPos=${startPos}, endPos=${endPos}`);
  console.log(`continuesToNext=${continuesToNext}, continuesFromPrevious=${continuesFromPrevious}`);
  console.log(`forceContinuous=${forceContinuous}, isPropagatedBlock=${isPropagatedBlock}, isOriginalBlock=${isOriginalBlock}`);
  
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

  // Calculate cell width percentages with fixed offsets for propagated and original blocks
  let cellStartOffset = 0;
  let cellEndOffset = 0;

  if (forceContinuous) {
    cellStartOffset = 0;
    cellEndOffset = 1;
  } else if (isPropagatedBlock) {
    // Propagated blocks: always start at 0 and end at 48%
    cellStartOffset = 0;
    cellEndOffset = 0.48;
  } else if (isOriginalBlock) {
    // Original blocks: always start at 52% and end at 100%
    cellStartOffset = 0.52;
    cellEndOffset = 1;
  } else {
    // Regular reservations - keep existing behavior
    cellStartOffset = continuesFromPrevious ? 0 : 0.52;
    cellEndOffset = continuesToNext ? 1 : 0.48;
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
  let borderRadiusStyle = '';

  // If forceContinuous, always use no radius
  if (forceContinuous) {
    borderRadiusStyle = 'rounded-none';
    console.log('Forced continuous segment - using no rounding');
  } else {
    // Normalize dates for comparison
    const normalizedStartDate = normalizeDate(new Date(startDate));
    const normalizedEndDate = normalizeDate(new Date(endDate));
    
    // Special handling for single day reservation
    if (isSameDay(normalizedStartDate, normalizedEndDate)) {
      borderRadiusStyle = 'rounded-full';
      console.log('Single day reservation - using rounded-full');
    } 
    // Special handling for one night stays
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
      if (isPropagatedBlock) {
        // Propagated blocks: ALWAYS round right side, only round left if it's the start
        borderRadiusStyle = 'rounded-r-lg';
        if (!continuesFromPrevious) {
          borderRadiusStyle = `${borderRadiusStyle} rounded-l-lg`;
        }
      }
      else if (isOriginalBlock) {
        // Original blocks: ALWAYS round left side, only round right if it's the end
        borderRadiusStyle = 'rounded-l-lg';
        if (!continuesToNext) {
          borderRadiusStyle = `${borderRadiusStyle} rounded-r-lg`;
        }
      }
      else {
        // Regular blocks
        let roundings = [];
        if (!continuesFromPrevious) roundings.push('rounded-l-lg');
        if (!continuesToNext) roundings.push('rounded-r-lg');
        borderRadiusStyle = roundings.join(' ');
      }
      
      console.log(`Multiple day reservation - using ${borderRadiusStyle}`);
    }
  }
  
  return { barLeft, barWidth, borderRadiusStyle };
};
