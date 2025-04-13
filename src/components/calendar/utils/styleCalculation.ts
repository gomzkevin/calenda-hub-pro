
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
  
  // Calculate positions and sizes based on check-in/check-out status
  let barWidth: string;
  let barLeft: string;
  
  // If this is just a check-in day (start of reservation)
  if (isCheckInDay) {
    // Start at 60% of the cell and go to the end (100%)
    barWidth = `${((1 / 7) * 0.4) * 100}%`;  // 40% of cell width
    barLeft = `${((startPos / 7) + ((1 / 7) * 0.6)) * 100}%`;  // Start at 60% position
    zIndex = 20; // Higher z-index for check-ins
  }
  // If this is just a check-out day (end of reservation)
  else if (isCheckOutDay) {
    // Start at 0% of the cell and go to 30%
    barWidth = `${((1 / 7) * 0.3) * 100}%`;  // 30% of cell width
    barLeft = `${(endPos / 7) * 100}%`;  // Start at beginning of cell
    zIndex = 15; // Medium z-index for check-outs
  }
  // For middle days (neither check-in nor check-out)
  else {
    // Calculate standard width across days
    barWidth = `${((endPos - startPos + 1) / 7) * 100}%`;
    barLeft = `${(startPos / 7) * 100}%`;
  }
  
  // Define border radius style based on if the reservation continues
  let borderRadiusStyle = '';
  if (isCheckInDay && isCheckOutDay) {
    borderRadiusStyle = 'rounded-full'; // Both ends rounded for single-day events
  } else if (isCheckInDay) {
    borderRadiusStyle = 'rounded-l-full'; // Only left end rounded for check-in days
  } else if (isCheckOutDay) {
    borderRadiusStyle = 'rounded-r-full'; // Only right end rounded for check-out days
  } else {
    borderRadiusStyle = 'rounded-none'; // No rounding for middle days
  }
  
  console.log(`Reservation from ${startDate} to ${endDate}: startPos=${startPos}, endPos=${endPos}, isCheckIn=${isCheckInDay}, isCheckOut=${isCheckOutDay}`);
  console.log(`Bar position: left=${barLeft}, width=${barWidth}, borderRadius=${borderRadiusStyle}`);
  
  return { barLeft, barWidth, borderRadiusStyle, clipPath, zIndex };
};
