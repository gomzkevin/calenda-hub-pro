
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { Reservation, Property } from '@/types';
import { normalizeDate } from '../../utils/dateUtils';

export const useMonthlyReservations = (
  currentMonth: Date,
  propertyId?: string,
  relatedPropertyIds: string[] = [],
  property?: Property | null
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

  // Filter and prioritize reservations according to property relationship rules
  const { filteredReservations, propagatedBlocks, relationshipBlocks } = useMemo(() => {
    if (!allReservations || allReservations.length === 0) {
      return { 
        filteredReservations: [], 
        propagatedBlocks: [], 
        relationshipBlocks: [] 
      };
    }
    
    console.log('Total reservations fetched:', allReservations.length);
    
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
    
    console.log('After primary filtering:', filteredByBlockStatus.length);
    
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
      // Priority 1: Regular reservations (no sourceReservationId and not Blocked) for current property
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
      
      // Priority 2 & 3: Handle blocks based on property type
      let blockReservations: Reservation[] = [];
      
      // MODIFICACIÓN PRINCIPAL: Distinguir entre tipos de propiedades para la propagación de bloqueos
      if (property?.type === 'parent') {
        // Si esta es una propiedad PADRE, los bloqueos vienen de:
        // 1. Reservas directas (con sourceReservationId)
        // 2. Reservas en propiedades HIJO (relatedPropertyIds)
        blockReservations = dayReservations.filter(res => 
          // Either it's a direct block with sourceReservationId on this property
          (res.propertyId === propertyId && 
           res.sourceReservationId !== undefined && 
           (res.notes === 'Blocked' || res.status === 'Blocked')) ||
          // OR it's a reservation on a CHILD property (causing implicit block on parent)
          (res.propertyId !== propertyId && 
           relatedPropertyIds.includes(res.propertyId) &&
           !res.sourceReservationId &&
           res.notes !== 'Blocked' &&
           res.status !== 'Blocked')
        );
        console.log('Parent property - blockReservations:', blockReservations.length);
      } 
      else if (property?.type === 'child') {
        // Si esta es una propiedad HIJO, los bloqueos vienen de:
        // 1. Reservas directas (con sourceReservationId)
        // 2. Reservas en la propiedad PADRE solamente
        blockReservations = dayReservations.filter(res => 
          // Either it's a direct block with sourceReservationId on this property
          (res.propertyId === propertyId && 
           res.sourceReservationId !== undefined && 
           (res.notes === 'Blocked' || res.status === 'Blocked')) ||
          // OR it's a reservation on the PARENT property
          (res.propertyId !== propertyId && 
           property?.parentId === res.propertyId && // Solo si es el padre, NO hermanos
           !res.sourceReservationId &&
           res.notes !== 'Blocked' &&
           res.status !== 'Blocked')
        );
        console.log('Child property - blockReservations:', blockReservations.length);
      }
      else {
        // Fallback para cuando no sabemos el tipo de propiedad (o no existe)
        blockReservations = dayReservations.filter(res => 
          // Either it's a direct block with sourceReservationId
          (res.propertyId === propertyId && 
           res.sourceReservationId !== undefined && 
           (res.notes === 'Blocked' || res.status === 'Blocked')) ||
          // OR it's a reservation on a related property
          (res.propertyId !== propertyId && 
           relatedPropertyIds.includes(res.propertyId) &&
           !res.sourceReservationId &&
           res.notes !== 'Blocked' &&
           res.status !== 'Blocked')
        );
        console.log('Unknown property type - blockReservations:', blockReservations.length);
      }
      
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
    
    console.log('Prioritized reservations:', prioritizedReservations.size);
    console.log('Prioritized blocks:', prioritizedBlocks.size);
    console.log('Prioritized relationship blocks:', prioritizedRelationshipBlocks.size);
    
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
    
    console.log('Direct reservations:', directReservations.length);
    console.log('Propagated blocks:', blockedReservations.length);
    console.log('Relationship blocks:', relatedBlocks.length);
    
    return {
      filteredReservations: directReservations,
      propagatedBlocks: blockedReservations,
      relationshipBlocks: relatedBlocks
    };
  }, [allReservations, propertyId, relatedPropertyIds, property]);

  return {
    filteredReservations,
    propagatedBlocks, 
    relationshipBlocks,
    isLoading
  };
};
