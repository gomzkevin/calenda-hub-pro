
import { eachDayOfInterval, eachWeekOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

// Helper to normalize date to local noon to avoid timezone issues
export const normalizeDate = (date: Date): Date => {
  if (!date) {
    console.error("Attempting to normalize undefined date");
    return new Date();
  }
  
  // Create a new date object to avoid mutating the original
  const newDate = new Date(date);
  
  // Set to local noon to ensure consistent date across timezones
  // This prevents the date from shifting due to UTC conversion
  newDate.setHours(12, 0, 0, 0);
  
  return newDate;
};

// Generate days for the month calendar
export const generateMonthDays = (currentMonth: Date): (Date | null)[][] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  
  // Create a 7x5 or 7x6 grid (depending on the month)
  const daysInGrid = [];
  const totalDaysInGrid = Math.ceil((monthDays.length + startDay) / 7) * 7;
  
  // Add empty cells for days before the start of the month
  for (let i = 0; i < startDay; i++) {
    daysInGrid.push(null);
  }
  
  // Add the days of the month
  daysInGrid.push(...monthDays);
  
  // Add empty cells for days after the end of the month
  const remainingCells = totalDaysInGrid - daysInGrid.length;
  for (let i = 0; i < remainingCells; i++) {
    daysInGrid.push(null);
  }
  
  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < daysInGrid.length; i += 7) {
    weeks.push(daysInGrid.slice(i, i + 7));
  }
  
  return weeks;
};
