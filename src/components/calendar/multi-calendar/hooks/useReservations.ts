
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation } from '@/types';
import { addDays, format, subDays, getMonth, getYear } from 'date-fns';

interface MonthInfo {
  month: number;
  year: number;
}

export const useReservations = (startDate: Date, endDate: Date) => {
  // Calculate months needed with less padding (reduced from 7 days to 3 days)
  // This reduces the unnecessary data fetching window
  const paddedStartDate = subDays(startDate, 3); // Fetch 3 days before (instead of 7)
  const paddedEndDate = addDays(endDate, 3);     // Fetch 3 days after (instead of 7)
  
  const startMonth = paddedStartDate.getMonth() + 1;
  const startYear = paddedStartDate.getFullYear();
  const endMonth = paddedEndDate.getMonth() + 1;
  const endYear = paddedEndDate.getFullYear();
  
  // Generate array of unique months to fetch (deduplication)
  const monthsToFetch: MonthInfo[] = [];
  const monthsSet = new Set<string>(); // For deduplication
  
  let currentDate = new Date(startYear, startMonth - 1, 1);
  const finalDate = new Date(endYear, endMonth - 1, 1);
  
  while (currentDate <= finalDate) {
    const month = getMonth(currentDate) + 1;
    const year = getYear(currentDate);
    const monthKey = `${year}-${month}`;
    
    if (!monthsSet.has(monthKey)) {
      monthsSet.add(monthKey);
      monthsToFetch.push({ month, year });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Fetch reservations for all months in range with optimized caching strategy
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', 'multi', monthsToFetch],
    queryFn: async () => {
      console.log(`Fetching data for ${monthsToFetch.length} months`);
      
      // Batch fetch reservations to reduce number of database calls
      const promises = monthsToFetch.map(({ month, year }) => 
        getReservationsForMonth(month, year)
      );
      
      const results = await Promise.all(promises);
      // Deduplicate reservations by ID to avoid duplicates from overlapping months
      const uniqueReservations = new Map<string, Reservation>();
      
      results.flat().forEach(reservation => {
        uniqueReservations.set(reservation.id, reservation);
      });
      
      return Array.from(uniqueReservations.values());
    },
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes to reduce API calls
    refetchOnWindowFocus: false // Prevent unnecessary refetches when window regains focus
  });
  
  // Apply reservation filtering with optimized algorithm
  // Filter reservations to avoid showing unnecessary blocks
  const filteredReservations = (reservations || []).filter(res => {
    // Handle regular reservations
    if (res.notes !== 'Blocked' && res.status !== 'Blocked') return true;
    
    // Special handling for blocks with improved performance
    if (res.sourceReservationId || res.isBlocking) return true;
    
    return false;
  });
  
  return {
    reservations: filteredReservations,
    isLoading
  };
};
