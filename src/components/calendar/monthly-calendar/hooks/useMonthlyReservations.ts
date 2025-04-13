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

  // Filter and prioritize reservations according to new rules
  const { filteredReservations, propagatedBlocks, relationshipBlocks } = useMemo(() => {
    if (!allReservations || allReservations.length === 0) {
      return { 
        filteredReservations: [], 
        propagatedBlocks: [], 
        relationshipBlocks: [] 
      };
    }
    
    // Normalize dates
    const normalizedReservations = allReservations.map(res => ({
      ...res,
      startDate: normalizeDate(new Date(res.startDate)),
      endDate: normalizeDate(new Date(res.endDate))
    }));
    
    // RULE 1: Apply primary filtering - filter out blocked reservations without sourceReservationId
    const filteredByBlockStatus = normalizedReservations.filter(res => 
      // Keep if it's not marked as "Blocked" in notes or status
      (res.notes !== 'Blocked' && res.status !== 'Blocked') || 
      // OR keep if it has a sourceReservationId (it's a legitimate propagated block)
      res.sourceReservationId !== undefined
    );
    
    // Group by day to apply prioritization rules
    const dayMap = new Map<string, Reservation[]>();
    
    filteredByBlockStatus.forEach(res => {
      // Calculate all days this reservation spans
      let currentDate = new Date(res.startDate);
      while (currentDate <= res.endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, []);
        }
        
        dayMap.get(dateKey)?.push(res);
        
        // Move to next day
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    // Apply prioritization rules for each day
    const prioritizedReservations = new Set<string>();
    const prioritizedBlocks = new Set<string>();
    const prioritizedRelationshipBlocks = new Set<string>();
    
    // Process each day
    dayMap.forEach((dayReservations, dateKey) => {
      // RULE 2: Apply prioritization
      // Priority 1: Regular reservations (no sourceReservationId)
      const regularReservations = dayReservations.filter(res => 
        res.propertyId === propertyId && 
        !res.sourceReservationId &&
        res.notes !== 'Blocked' &&
        res.status !== 'Blocked'
      );
      
      if (regularReservations.length > 0) {
        // Add all regular reservations to the displayed set
        regularReservations.forEach(res => prioritizedReservations.add(res.id));
        return; // Skip to next day - regular reservations take priority
      }
      
      // Priority 2 & 3: Handle blocks
      const blockReservations = dayReservations.filter(res => 
        res.sourceReservationId !== undefined && 
        (res.notes === 'Blocked' || res.status === 'Blocked')
      );
      
      if (blockReservations.length > 0) {
        blockReservations.forEach(res => {
          // Check if it's a relationship block (different property)
          if (res.propertyId !== propertyId) {
            prioritizedRelationshipBlocks.add(res.id);
          } else {
            // It's a direct block on this property
            prioritizedBlocks.add(res.id);
          }
        });
      }
    });
    
    // Create the final filtered sets
    const directReservations = normalizedReservations.filter(
      res => res.propertyId === propertyId && prioritizedReservations.has(res.id)
    );
    
    // Propagated blocks are blocks directly on this property
    const blockedReservations = normalizedReservations.filter(
      res => res.propertyId === propertyId && prioritizedBlocks.has(res.id)
    );
    
    // Relationship blocks are from related properties
    const relatedBlocks = normalizedReservations.filter(
      res => res.propertyId !== propertyId && prioritizedRelationshipBlocks.has(res.id)
    );
    
    return {
      filteredReservations: directReservations,
      propagatedBlocks: blockedReservations,
      relationshipBlocks: relatedBlocks
    };
  }, [allReservations, propertyId]);

  return {
    filteredReservations,
    propagatedBlocks, 
    relationshipBlocks,
    isLoading
  };
};
