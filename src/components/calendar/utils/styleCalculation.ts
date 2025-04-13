
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
): { 
  barLeft: string, 
  barWidth: string, 
  borderRadiusStyle: string,
  clipPath?: string,
  zIndex: number
} => {
  // Determine if this is a check-in or check-out day
  const isCheckInDay = !continuesFromPrevious;
  const isCheckOutDay = !continuesToNext;
  
  // Different visualization strategy for check-in and check-out days
  let clipPath: string | undefined;
  let zIndex = 10; // Default z-index
  
  // For single-day events (check-in and check-out on same day)
  if (isCheckInDay && isCheckOutDay) {
    // Full cell width for one-day stays
    const barWidth = `${(1 / 7) * 100}%`;
    const barLeft = `${(startPos / 7) * 100}%`;
    return { 
      barLeft, 
      barWidth, 
      borderRadiusStyle: 'rounded-full',
      clipPath: undefined,
      zIndex: 30 // Higher z-index for single day events
    };
  }
  
  // If this is just a check-in day (start of reservation)
  if (isCheckInDay) {
    // Use triangle shape pointing right (narrow left, wide right)
    clipPath = 'polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%)';
    zIndex = 20; // Higher z-index for check-ins
  }
  // If this is just a check-out day (end of reservation)
  else if (isCheckOutDay) {
    // Use triangle shape pointing left (wide left, narrow right)
    clipPath = 'polygon(0% 0%, 70% 0%, 70% 100%, 0% 100%)';
    zIndex = 15; // Medium z-index for check-outs
  }
  
  // Calculate standard bar positions (different for check-in and check-out)
  let barWidth: string;
  let barLeft: string;
  
  // For check-in days, we want to occupy the full cell
  if (isCheckInDay) {
    barWidth = `${(1 / 7) * 100}%`;
    barLeft = `${(startPos / 7) * 100}%`;
  } 
  // For check-out days, we also want to occupy the full cell 
  else if (isCheckOutDay) {
    barWidth = `${(1 / 7) * 100}%`;
    barLeft = `${(endPos / 7) * 100}%`;
  }
  // For middle days (neither check-in nor check-out)
  else {
    // Calculate standard width across days
    barWidth = `${((endPos - startPos + 1) / 7) * 100}%`;
    barLeft = `${(startPos / 7) * 100}%`;
  }
  
  // Define border radius style based on if the reservation continues
  let borderRadiusStyle = 'rounded-full';
  if (continuesFromPrevious && continuesToNext) {
    borderRadiusStyle = 'rounded-none';
  } else if (continuesFromPrevious) {
    borderRadiusStyle = 'rounded-r-full rounded-l-none';
  } else if (continuesToNext) {
    borderRadiusStyle = 'rounded-l-full rounded-r-none';
  }
  
  console.log(`Reservation from ${startDate} to ${endDate}: startPos=${startPos}, endPos=${endPos}, isCheckIn=${isCheckInDay}, isCheckOut=${isCheckOutDay}`);
  
  return { barLeft, barWidth, borderRadiusStyle, clipPath, zIndex };
};
