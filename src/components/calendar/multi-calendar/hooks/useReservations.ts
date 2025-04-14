
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation } from '@/types';
import { addDays, format } from 'date-fns';

interface MonthInfo {
  month: number;
  year: number;
}

export const useReservations = (startDate: Date, endDate: Date) => {
  // Determine which months to fetch
  const startMonth = startDate.getMonth() + 1;
  const startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  
  console.log(`Fetching reservations from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
  
  const monthsToFetch: MonthInfo[] = [
    { month: startMonth, year: startYear },
  ];
  
  if (startMonth !== endMonth || startYear !== endYear) {
    monthsToFetch.push({ month: endMonth, year: endYear });
  }
  
  // Fetch reservations for the visible date range
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
