
import { isSameDay } from "date-fns";
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";

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

/**
 * Get reservation color class based on platform
 */
export const getReservationColorClass = (reservation: Reservation): string => {
  // Check status first for blocked dates
  if (reservation.status === 'Blocked' || reservation.notes === 'Blocked') {
    return 'bg-gray-400 border-gray-500 text-white';
  }

  // If it's a propagated block from a relationship
  if (reservation.isRelationshipBlock) {
    return 'bg-orange-200 border-orange-300 text-orange-700';
  }

  // For regular reservations, use platform colors
  switch (reservation.platform?.toLowerCase()) {
    case 'airbnb':
      return 'bg-pink-500 border-pink-600 text-white';
    case 'booking':
      return 'bg-blue-500 border-blue-600 text-white';
    case 'vrbo':
    case 'homeaway':
      return 'bg-green-500 border-green-600 text-white';
    case 'tripadvisor':
      return 'bg-emerald-500 border-emerald-600 text-white';
    case 'manual':
      return 'bg-purple-500 border-purple-600 text-white';
    default:
      return 'bg-slate-500 border-slate-600 text-white';
  }
};

/**
 * Get complete reservation style based on reservation details
 */
export const getReservationStyle = (reservation: Reservation, isIndirect: boolean = false): string => {
  let baseStyle = getReservationColorClass(reservation);
  
  // If it's an indirect reservation (from another property)
  if (isIndirect) {
    // Adjust opacity for indirect reservations
    return baseStyle.replace(/bg-([a-z]+-[0-9]+)/, 'bg-$1/30').replace(/text-white/, 'text-gray-700');
  }
  
  return baseStyle;
};

/**
 * Generate tooltip positioning style
 */
export const generateTooltipPositionStyle = (dayIndex: number, totalDays: number) => {
  // Default position is centered
  let horizontalPosition = 'left-1/2 -translate-x-1/2';
  
  // Position tooltips at the edges to avoid going off-screen
  if (dayIndex < 2) {
    horizontalPosition = 'left-0';
  } else if (dayIndex > totalDays - 3) {
    horizontalPosition = 'right-0';
  }
  
  return horizontalPosition;
};
