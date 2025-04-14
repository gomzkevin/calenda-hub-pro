
import { eachDayOfInterval, eachWeekOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

// Helper to normalize date to local noon to avoid timezone issues
export const normalizeDate = (date: Date): Date => {
  // Create a new date object to avoid mutating the original
  const newDate = new Date(date);
  
  // Set to local noon to ensure consistent date across timezones
  // This prevents the date from shifting due to UTC conversion
  newDate.setHours(12, 0, 0, 0);
  
  // Log the input and output dates for debugging
  console.log(`Normalizing date: ${date.toISOString()} -> ${newDate.toISOString()}`);
  
  return newDate;
};

// Generate days for the month calendar
export const generateMonthDays = (currentMonth: Date): (Date | null)[][] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  
  // Create a grid (5 or 6 weeks depending on the month)
  const daysInGrid = [];
  const totalDaysInGrid = Math.ceil((monthDays.length + startDay) / 7) * 7;
  
  // Add empty cells for days before the start of the month
  for (let i = 0; i < startDay; i++) {
    daysInGrid.push(null);
  }
  
  // Add the days of the month (normalize each date)
  for (const day of monthDays) {
    const normalizedDay = new Date(day);
    normalizedDay.setHours(12, 0, 0, 0);
    daysInGrid.push(normalizedDay);
  }
  
  // Add empty cells for days after the end of the month
  const remainingCells = totalDaysInGrid - daysInGrid.length;
  for (let i = 0; i < remainingCells; i++) {
    daysInGrid.push(null);
  }
  
  // Group days into weeks (crucial for correct rendering of reservations)
  const weeks = [];
  for (let i = 0; i < daysInGrid.length; i += 7) {
    weeks.push(daysInGrid.slice(i, i + 7));
  }
  
  return weeks;
};
