
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation } from '@/types';
import { normalizeDate } from '../../utils/dateUtils';

export const useMonthlyReservations = (
  currentMonth: Date,
  propertyId?: string,
  relatedPropertyIds: string[] = []
) => {
  // Use React Query to fetch all reservations for the current month
  const { data: allReservations = [], isLoading } = useQuery({
    queryKey: ['reservations', currentMonth.getMonth() + 1, currentMonth.getFullYear(), propertyId, relatedPropertyIds],
    queryFn: async () => {
      try {
        // Get all reservations for this month
        const monthlyReservations = await getReservationsForMonth(
          currentMonth.getMonth() + 1, 
          currentMonth.getFullYear()
        );
        
        // If no property is selected, return all reservations
        if (!propertyId) {
          return monthlyReservations;
        }
        
        // Create a set of all relevant property IDs (selected property + related ones)
        const relevantPropertyIds = new Set([propertyId, ...relatedPropertyIds]);
        
        // Filter reservations for the specific property and its related properties
        return monthlyReservations.filter(res => relevantPropertyIds.has(res.propertyId));
      } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
      }
    },
    enabled: !!currentMonth
  });

  // Filter reservations - main reservations, blocked and relationship blocks
  const { filteredReservations, propagatedBlocks, relationshipBlocks } = useMemo(() => {
    if (!allReservations || allReservations.length === 0) {
      return { filteredReservations: [], propagatedBlocks: [], relationshipBlocks: [] };
    }
    
    // Normalize dates
    const normalizedReservations = allReservations.map(res => ({
      ...res,
      startDate: normalizeDate(new Date(res.startDate)),
      endDate: normalizeDate(new Date(res.endDate))
    }));
    
    // Filter reservations for the selected property
    const directReservations = normalizedReservations.filter(
      res => res.propertyId === propertyId && 
             res.notes !== 'Blocked' &&
             res.status !== 'Blocked' &&
             !res.isRelationshipBlock
    );
    
    // Identify propagated blocks (blocks created due to sourceReservationId)
    const blockedReservations = normalizedReservations.filter(res => 
      res.propertyId === propertyId &&
      res.sourceReservationId && 
      (res.notes === 'Blocked' || res.status === 'Blocked')
    );
    
    // Identify relationship blocks (for parent-child properties)
    const relatedBlocks = normalizedReservations.filter(res => 
      // Include blocks from related properties that would affect this property
      res.propertyId !== propertyId && 
      relatedPropertyIds.includes(res.propertyId) &&
      !res.sourceReservationId // Avoid duplicates with propagated blocks
    );
    
    return {
      filteredReservations: directReservations,
      propagatedBlocks: blockedReservations,
      relationshipBlocks: relatedBlocks
    };
  }, [allReservations, propertyId, relatedPropertyIds]);

  return {
    filteredReservations,
    propagatedBlocks, 
    relationshipBlocks,
    isLoading
  };
};
