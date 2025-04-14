
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation } from '@/types';
import { addDays, isSameMonth } from 'date-fns';
import { normalizeDate } from '../../utils/dateUtils';

interface MonthInfo {
  month: number;
  year: number;
}

export const useReservations = (startDate: Date, endDate: Date) => {
  // Normalize dates to avoid timezone issues
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  // Determine which months to fetch - include all months that overlap with the visible range
  const months = new Set<string>(); // Use a Set to avoid duplicates
  
  // Add the start month
  const startMonth = normalizedStartDate.getMonth() + 1;
  const startYear = normalizedStartDate.getFullYear();
  months.add(`${startYear}-${startMonth}`);
  
  // Add the end month if different
  const endMonth = normalizedEndDate.getMonth() + 1;
  const endYear = normalizedEndDate.getFullYear();
  months.add(`${endYear}-${endMonth}`);
  
  // If the date range spans more than two months, add intermediate months
  let currentDate = new Date(normalizedStartDate);
  while (currentDate <= normalizedEndDate) {
    const m = currentDate.getMonth() + 1;
    const y = currentDate.getFullYear();
    months.add(`${y}-${m}`);
    
    // Move to the next month (simply add enough days to ensure we're in the next month)
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 15));
  }
  
  // Convert the Set to an array of MonthInfo objects
  const monthsToFetch: MonthInfo[] = Array.from(months).map(monthStr => {
    const [year, month] = monthStr.split('-').map(Number);
    return { month, year };
  });
  
  // Fetch reservations for all relevant months
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', 'multi', monthsToFetch],
    queryFn: async () => {
      const promises = monthsToFetch.map(({ month, year }) => 
        getReservationsForMonth(month, year)
      );
      const results = await Promise.all(promises);
      return results.flat();
    }
  });
  
  // Filter reservations
  const filteredReservations = (reservations || []).filter(res => {
    // Apply the same filtering rules as in useMonthlyReservations
    if (res.notes !== 'Blocked' && res.status !== 'Blocked') return true;
    if (res.sourceReservationId || res.isBlocking) return true;
    return false;
  });
  
  return {
    reservations: filteredReservations,
    isLoading
  };
};
