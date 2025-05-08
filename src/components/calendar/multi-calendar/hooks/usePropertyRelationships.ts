
import { useMemo } from 'react';
import { Property, Reservation } from '@/types';

type PropertyMap = Map<string, Property>;

export const usePropertyRelationships = (properties: Property[], reservations: Reservation[]) => {
  // Convert properties array to a map for faster lookups
  const propertyMap: PropertyMap = useMemo(() => {
    const map = new Map<string, Property>();
    properties.forEach(property => {
      map.set(property.id, property);
    });
    return map;
  }, [properties]);

  // Establish parent-child relationships between properties
  const { parentToChildren, childToParent, siblingGroups } = useMemo(() => {
    const parentToChildren = new Map<string, string[]>();
    const childToParent = new Map<string, string>();
    const siblingGroups = new Map<string, string[]>();

    // First pass: collect all explicit parent-child relationships from properties
    properties.forEach(property => {
      if (property.type === 'child' && property.parentId) {
        // Update childToParent map
        childToParent.set(property.id, property.parentId);
        
        // Update parentToChildren map
        if (!parentToChildren.has(property.parentId)) {
          parentToChildren.set(property.parentId, []);
        }
        const siblings = parentToChildren.get(property.parentId) || [];
        if (!siblings.includes(property.id)) {
          siblings.push(property.id);
        }
      }
    });

    // Second pass: identify sibling groups (properties with the same parent)
    properties.forEach(property => {
      if (property.type === 'child' && property.parentId) {
        const siblings = parentToChildren.get(property.parentId) || [];
        if (siblings.length > 1) {
          siblingGroups.set(property.id, [...siblings].filter(id => id !== property.id));
        }
      }
    });

    return { parentToChildren, childToParent, siblingGroups };
  }, [properties]);

  // Helper function to get source reservation information
  const getSourceReservationInfo = (reservation: Reservation) => {
    if (!reservation.sourceReservationId) {
      return { property: undefined, reservation: undefined };
    }

    // Find the source reservation
    const sourceReservation = reservations.find(r => r.id === reservation.sourceReservationId);
    if (!sourceReservation) {
      return { property: undefined, reservation: undefined };
    }

    // Get the source property
    const sourceProperty = propertyMap.get(sourceReservation.propertyId);
    
    return {
      property: sourceProperty,
      reservation: sourceReservation
    };
  };

  return {
    parentToChildren,
    childToParent,
    siblingGroups,
    getSourceReservationInfo
  };
};
