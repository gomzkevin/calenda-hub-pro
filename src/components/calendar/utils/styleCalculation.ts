
import { isSameDay } from "date-fns";
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

/**
 * Get styling for a reservation based on platform
 */
export const getReservationStyle = (reservation: Reservation, isIndirect: boolean): string => {
  // If this is a propagated block, use gray color
  if (isIndirect || reservation.status === 'Blocked' || reservation.notes === 'Blocked') {
    return 'bg-gray-400';
  }
  
  // For direct reservations, use platform-specific colors
  switch (reservation.platform.toLowerCase()) {
    case 'airbnb': return 'bg-rose-500';
    case 'booking': return 'bg-blue-600';
    case 'vrbo': return 'bg-green-600';
    case 'other': return 'bg-purple-600';
    default: return 'bg-purple-600';
  }
};

/**
 * Calculate bar position and style
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
  // Ensure positions are valid
  if (startPos === -1 || endPos === -1) {
    return { barLeft: '0%', barWidth: '0%', borderRadiusStyle: '' };
  }
  
  // For cases where startPos > endPos, adjust to ensure proper rendering
  if (startPos > endPos) {
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
