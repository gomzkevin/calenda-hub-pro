
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation } from '@/types';
import { addDays, format, subDays, getMonth, getYear, isSameMonth } from 'date-fns';
import { useMemo } from 'react';

interface MonthInfo {
  month: number;
  year: number;
}

export const useReservations = (startDate: Date, endDate: Date) => {
  // Optimize the date range - fetch only what's needed (reduce from 7 days to 3)
  const paddedStartDate = subDays(startDate, 3); // Reduced from 7 to 3 days before
  const paddedEndDate = addDays(endDate, 3);     // Reduced from 7 to 3 days after
  
  // Generate array of all months to fetch - now memoized to prevent recalculation
  const monthsToFetch: MonthInfo[] = useMemo(() => {
    const months: MonthInfo[] = [];
    
    // Only add start month if it's different from end month
    const startMonth = paddedStartDate.getMonth() + 1;
    const startYear = paddedStartDate.getFullYear();
    const endMonth = paddedEndDate.getMonth() + 1;
    const endYear = paddedEndDate.getFullYear();
    
    let currentDate = new Date(startYear, startMonth - 1, 1);
    const finalDate = new Date(endYear, endMonth - 1, 1);
    
    while (currentDate <= finalDate) {
      months.push({
        month: getMonth(currentDate) + 1,
        year: getYear(currentDate)
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }, [paddedStartDate, paddedEndDate]);
  
  // Fetch reservations for all months in range with optimized caching
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', 'multi', monthsToFetch],
    queryFn: async () => {
      const promises = monthsToFetch.map(({ month, year }) => 
        getReservationsForMonth(month, year)
      );
      const results = await Promise.all(promises);
      
      // Deduplicate reservations (in case they span multiple months)
      const reservationMap = new Map<string, Reservation>();
      results.flat().forEach(res => {
        reservationMap.set(res.id, res);
      });
      
      return Array.from(reservationMap.values());
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false // Prevent refetching on window focus
  });
  
  // Build relationship mapping - now memoized
  const propertyRelationships = useMemo(() => {
    const relationships = new Map<string, { parentId: string | null, childIds: string[] }>();
    
    reservations.forEach(res => {
      if (res.sourceReservationId) {
        // Find the source reservation
        const sourceRes = reservations.find(r => r.id === res.sourceReservationId);
        if (sourceRes) {
          // Initialize structure if needed
          if (!relationships.has(sourceRes.propertyId)) {
            relationships.set(sourceRes.propertyId, { parentId: null, childIds: [] });
          }
          
          // Store the relationship
          const propertyRelation = relationships.get(sourceRes.propertyId);
          if (propertyRelation) {
            // If source is adding a child
            propertyRelation.childIds.push(res.propertyId);
            
            // Initialize the child's structure if needed
            if (!relationships.has(res.propertyId)) {
              relationships.set(res.propertyId, { parentId: sourceRes.propertyId, childIds: [] });
            } else {
              // Update the parent reference
              const childRelation = relationships.get(res.propertyId);
              if (childRelation) {
                childRelation.parentId = sourceRes.propertyId;
              }
            }
          }
        }
      }
    });
    
    return relationships;
  }, [reservations]);
  
  // Filter reservations - now memoized
  const filteredReservations = useMemo(() => {
    return (reservations || []).filter(res => {
      // First apply basic filters (same as before)
      if (res.notes !== 'Blocked' && res.status !== 'Blocked') return true;
      
      // Special handling for blocks
      if (res.sourceReservationId) {
        // Find source reservation
        const sourceRes = reservations.find(r => r.id === res.sourceReservationId);
        if (!sourceRes) return false; // Source not found, skip
        
        // Check if this is a sibling block (two children of the same parent)
        // We need to find this reservation's parent property
        const currentPropertyRelation = propertyRelationships.get(res.propertyId);
        
        if (currentPropertyRelation && currentPropertyRelation.parentId) {
          // This is a child property - see if the source property is a sibling
          const sourcePropertyRelation = propertyRelationships.get(sourceRes.propertyId);
          
          if (sourcePropertyRelation && sourcePropertyRelation.parentId === currentPropertyRelation.parentId) {
            // Both properties have the same parent - they are siblings
            // In this case, we should NOT show the block (filter it out)
            return false;
          }
        }
        
        // If we reach here, it's a valid parent-child block
        return true;
      }
      
      // Include manually created blocks
      return res.isBlocking;
    });
  }, [reservations, propertyRelationships]);
  
  return {
    reservations: filteredReservations,
    isLoading
  };
};
