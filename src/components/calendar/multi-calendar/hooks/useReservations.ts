
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
  
  // Create a map to identify parent-child relationships between properties
  // This will help us filter out sibling blocks
  const propertyRelationships = new Map<string, { parentId: string | null, childIds: string[] }>();
  
  // Build relationship mapping
  reservations.forEach(res => {
    if (res.sourceReservationId) {
      // Find the source reservation
      const sourceRes = reservations.find(r => r.id === res.sourceReservationId);
      if (sourceRes) {
        // Initialize structure if needed
        if (!propertyRelationships.has(sourceRes.propertyId)) {
          propertyRelationships.set(sourceRes.propertyId, { parentId: null, childIds: [] });
        }
        
        // Store the relationship
        const propertyRelation = propertyRelationships.get(sourceRes.propertyId);
        if (propertyRelation) {
          // If source is adding a child
          propertyRelation.childIds.push(res.propertyId);
          
          // Initialize the child's structure if needed
          if (!propertyRelationships.has(res.propertyId)) {
            propertyRelationships.set(res.propertyId, { parentId: sourceRes.propertyId, childIds: [] });
          } else {
            // Update the parent reference
            const childRelation = propertyRelationships.get(res.propertyId);
            if (childRelation) {
              childRelation.parentId = sourceRes.propertyId;
            }
          }
        }
      }
    }
  });
  
  console.log('Property relationships map built:', 
    Array.from(propertyRelationships.entries())
      .map(([id, { parentId, childIds }]) => 
        `${id} => Parent: ${parentId || 'none'}, Children: [${childIds.join(', ')}]`
      ).join('\n')
  );
  
  // Filter reservations
  const filteredReservations = (reservations || []).filter(res => {
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
          console.log(`Filtering out sibling block: ${res.id} from property ${res.propertyId} blocked by sibling ${sourceRes.propertyId}`);
          return false;
        }
      }
      
      // If we reach here, it's a valid parent-child block
      return true;
    }
    
    // Include manually created blocks
    if (res.isBlocking) return true;
    
    return false;
  });
  
  console.log(`After filtering: ${filteredReservations.length} reservations remain`);
  
  return {
    reservations: filteredReservations,
    isLoading
  };
};
