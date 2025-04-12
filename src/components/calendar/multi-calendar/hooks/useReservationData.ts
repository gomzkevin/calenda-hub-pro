
import { useCallback } from 'react';
import { Reservation, Property } from '@/types';
import { normalizeDate } from '../utils';

export const useReservationData = (
  reservations: Reservation[],
  properties: Property[],
  propertyRelationships: {
    parentToChildren: Map<string, string[]>;
    childToParent: Map<string, string>;
  }
) => {
  // Helper function to get reservations for a property
  const getReservationsForProperty = useCallback((propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  }, [reservations]);

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
      
      for (const childId of childrenIds) {
        const childReservations = getReservationsForProperty(childId).filter(res => {
          const normalizedStart = normalizeDate(res.startDate);
          const normalizedEnd = normalizeDate(res.endDate);
          return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
        });
        
        if (childReservations.length > 0) {
          return { 
            hasReservation: true, 
            isIndirect: true,
            reservations: childReservations
          };
        }
      }
    }
    
    // For child properties, check parent reservations
    if (property.type === 'child' && property.parentId) {
      const parentReservations = getReservationsForProperty(property.parentId).filter(res => {
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
  }, [getReservationsForProperty, propertyRelationships.parentToChildren]);

  return {
    getReservationsForProperty,
    getSourceReservationInfo,
    getDayReservationStatus
  };
};
