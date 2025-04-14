
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation } from '@/types';
import { addDays, format, subDays, getMonth, getYear } from 'date-fns';

interface MonthInfo {
  month: number;
  year: number;
}

export const useReservations = (startDate: Date, endDate: Date) => {
  // Determine which months to fetch - including padding for better reservation visibility
  const paddedStartDate = subDays(startDate, 7); // Fetch 1 week before
  const paddedEndDate = addDays(endDate, 7);     // Fetch 1 week after
  
  const startMonth = paddedStartDate.getMonth() + 1;
  const startYear = paddedStartDate.getFullYear();
  const endMonth = paddedEndDate.getMonth() + 1;
  const endYear = paddedEndDate.getFullYear();
  
  console.log(`Fetching reservations from ${format(paddedStartDate, 'yyyy-MM-dd')} to ${format(paddedEndDate, 'yyyy-MM-dd')}`);
  
  // Generate array of all months to fetch
  const monthsToFetch: MonthInfo[] = [];
  
  let currentDate = new Date(startYear, startMonth - 1, 1);
  const finalDate = new Date(endYear, endMonth - 1, 1);
  
  while (currentDate <= finalDate) {
    monthsToFetch.push({
      month: getMonth(currentDate) + 1,
      year: getYear(currentDate)
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  console.log(`Months to fetch: ${monthsToFetch.map(m => `${m.year}-${m.month}`).join(', ')}`);
  
  // Fetch reservations for all months in range
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
  
  console.log(`Fetched ${reservations.length} reservations across ${monthsToFetch.length} months`);
  
  // Filter reservations
  const filteredReservations = (reservations || []).filter(res => {
    // Aplicar las mismas reglas de filtrado que en useMonthlyReservations
    if (res.notes !== 'Blocked' && res.status !== 'Blocked') return true;
    if (res.sourceReservationId || res.isBlocking) return true;
    return false;
  });
  
  return {
    reservations: filteredReservations,
    isLoading
  };
};
