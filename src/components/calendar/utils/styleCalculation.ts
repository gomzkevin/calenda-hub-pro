
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

  // Calculate cell width percentages with adjusted offsets
  let cellStartOffset = 0;
  let cellEndOffset = 0;
  
  // Force continuous takes precedence
  if (forceContinuous) {
    cellStartOffset = 0;
    cellEndOffset = 1;
  } 
  // Propagated blocks end at 45%
  else if (isPropagatedBlock) {
    cellStartOffset = 0;
    cellEndOffset = 0.45;
  } 
  // Original blocks start at 55%
  else if (isOriginalBlock) {
    cellStartOffset = 0.55;
    cellEndOffset = 1;
  } 
  // Regular blocks
  else {
    cellStartOffset = continuesFromPrevious ? 0 : 0.52;
    cellEndOffset = continuesToNext ? 1 : 0.48;
  }
  
  // Apply offsets
  const adjustedStartPos = startPos + cellStartOffset;
  const adjustedEndPos = endPos + cellEndOffset;
  
  // Calculate percentage values
  const barWidth = `${((adjustedEndPos - adjustedStartPos) / 7) * 100}%`;
  const barLeft = `${(adjustedStartPos / 7) * 100}%`;
  
  console.log(`Adjusted positions: start=${adjustedStartPos}, end=${adjustedEndPos}`);
  console.log(`Bar styling: width=${barWidth}, left=${barLeft}`);
  
  // Define border radius style
  let borderRadiusStyle = '';

  if (forceContinuous) {
    borderRadiusStyle = 'rounded-none';
  } else {
    // Normalize dates for comparison
    const normalizedStartDate = normalizeDate(new Date(startDate));
    const normalizedEndDate = normalizeDate(new Date(endDate));
    
    // Single day reservation
    if (isSameDay(normalizedStartDate, normalizedEndDate)) {
      borderRadiusStyle = 'rounded-full';
    } 
    // One night stays
    else if (
      !continuesFromPrevious && 
      !continuesToNext && 
      (endPos - startPos === 1 || (startPos === endPos && !isSameDay(normalizedStartDate, normalizedEndDate)))
    ) {
      borderRadiusStyle = 'rounded-lg';
    }
    // Multiple day reservation
    else {
      if (isPropagatedBlock) {
        borderRadiusStyle = 'rounded-r-lg';
        if (!continuesFromPrevious) {
          borderRadiusStyle = `${borderRadiusStyle} rounded-l-lg`;
        }
      }
      else if (isOriginalBlock) {
        borderRadiusStyle = 'rounded-l-lg';
        if (!continuesToNext) {
          borderRadiusStyle = `${borderRadiusStyle} rounded-r-lg`;
        }
      }
      else {
        if (!continuesFromPrevious) borderRadiusStyle += ' rounded-l-lg';
        if (!continuesToNext) borderRadiusStyle += ' rounded-r-lg';
      }
    }
  }
  
  return { barLeft, barWidth, borderRadiusStyle };
};
