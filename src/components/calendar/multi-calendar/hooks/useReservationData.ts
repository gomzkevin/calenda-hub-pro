
import { useCallback } from 'react';
import { Reservation, Property } from '@/types';
import { normalizeDate } from '../utils';

export const useReservationData = (
  reservations: Reservation[],
  properties: Property[],
  propertyRelationships: {
    parentToChildren: Map<string, string[]>;
    childToParent: Map<string, string>;
    siblingGroups: Map<string, string[]>;
  }
) => {
  // Helper function to get reservations for a property
  const getReservationsForProperty = useCallback((propertyId: string): Reservation[] => {
    return reservations.filter(res => {
      // Basic filter - direct reservations for this property
      if (res.propertyId === propertyId) return true;
      
      // For blocks: check if it's not a sibling block
      if (res.status === 'Blocked' && res.sourceReservationId) {
        // Get source reservation
        const sourceReservation = reservations.find(r => r.id === res.sourceReservationId);
        if (!sourceReservation) return false;
        
        // Check if this property is a sibling of the source property
        const parentId = propertyRelationships.childToParent.get(propertyId);
        const sourceParentId = propertyRelationships.childToParent.get(sourceReservation.propertyId);
        
        // If both have the same parent (siblings), don't show the block
        if (parentId && sourceParentId && parentId === sourceParentId) {
          console.log(`Filtering sibling block from ${sourceReservation.propertyId} to ${propertyId}`);
          return false;
        }
      }
      
      return false;
    });
  }, [reservations, propertyRelationships.childToParent]);

  // Get source reservation info for linked reservations
  const getSourceReservationInfo = useCallback((reservation: Reservation): { property?: Property, reservation?: Reservation } => {
    if (!reservation.sourceReservationId) return {};
    
    const sourceReservation = reservations.find(r => r.id === reservation.sourceReservationId);
    if (!sourceReservation) return {};
    
    const sourceProperty = properties.find(p => p.id === sourceReservation.propertyId);
    
    return { property: sourceProperty, reservation: sourceReservation };
  }, [reservations, properties]);

  // Determine reservation status for a property on a specific day
  const getDayReservationStatus = useCallback((property: Property, day: Date) => {
    const normalizedDay = normalizeDate(day);
    
    // Check for direct reservations on this property
    const directReservations = getReservationsForProperty(property.id).filter(res => {
      const normalizedStart = normalizeDate(res.startDate);
      const normalizedEnd = normalizeDate(res.endDate);
      return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
    });
    
    if (directReservations.length > 0) {
      return { 
        hasReservation: true, 
        isIndirect: false,
        reservations: directReservations
      };
    }
    
    // For parent properties, check child reservations 
    if (property.type === 'parent') {
      const childrenIds = propertyRelationships.parentToChildren.get(property.id) || [];
      const childReservationsForDay: Reservation[] = [];
      
      for (const childId of childrenIds) {
        // Get all child property reservations that overlap with this day
        const childReservations = reservations.filter(res => {
          if (res.propertyId !== childId) return false;
          
          // Skip blocks propagated from other properties
          if (res.status === 'Blocked' && res.sourceReservationId) {
            // Get source reservation to check if it's from a sibling
            const sourceRes = reservations.find(r => r.id === res.sourceReservationId);
            if (sourceRes && propertyRelationships.childToParent.get(sourceRes.propertyId) === propertyRelationships.childToParent.get(childId)) {
              return false; // Skip sibling blocks
            }
          }
          
          const normalizedStart = normalizeDate(res.startDate);
          const normalizedEnd = normalizeDate(res.endDate);
          return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
        });
        
        if (childReservations.length > 0) {
          childReservationsForDay.push(...childReservations);
        }
      }
      
      if (childReservationsForDay.length > 0) {
        return { 
          hasReservation: true, 
          isIndirect: true,
          reservations: childReservationsForDay
        };
      }
    }
    
    // For child properties, check parent reservations
    if (property.type === 'child' && property.parentId) {
      const parentReservations = reservations.filter(res => {
        // Only include direct reservations for the parent, not blocks
        if (res.propertyId !== property.parentId) return false;
        if (res.status === 'Blocked' && res.sourceReservationId) return false;
        
        const normalizedStart = normalizeDate(res.startDate);
        const normalizedEnd = normalizeDate(res.endDate);
        return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
      });
      
      if (parentReservations.length > 0) {
        return { 
          hasReservation: true, 
          isIndirect: true,
          reservations: parentReservations
        };
      }
    }
    
    // No reservations found
    return { 
      hasReservation: false, 
      isIndirect: false,
      reservations: []
    };
  }, [getReservationsForProperty, propertyRelationships.parentToChildren, propertyRelationships.childToParent, reservations]);

  return {
    getReservationsForProperty,
    getSourceReservationInfo,
    getDayReservationStatus
  };
};
