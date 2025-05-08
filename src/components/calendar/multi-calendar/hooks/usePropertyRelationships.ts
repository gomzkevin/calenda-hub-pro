
import { useMemo } from 'react';
import { Property } from '@/types';

// Custom hook to manage property relationship mappings efficiently
export function usePropertyRelationships(properties: Property[]) {
  // Create relationship maps to optimize lookups - now properly memoized
  return useMemo(() => {
    // Properties that are parents of other properties
    const parentIds = new Set<string>();
    
    // Map of child property IDs to their parent property ID
    const childToParent = new Map<string, string>();
    
    // Map of parent property IDs to arrays of their child property IDs
    const parentToChildren = new Map<string, string[]>();
    
    // Map of parent property IDs to arrays of sibling groups
    const siblingGroups = new Map<string, string[]>();
    
    // Build the relationship maps in a single pass through properties
    properties.forEach(property => {
      // If this property has a parent, record the child-parent relationship
      if (property.parentId) {
        childToParent.set(property.id, property.parentId);
        
        // Initialize or update the parent's children list
        if (!parentToChildren.has(property.parentId)) {
          parentToChildren.set(property.parentId, []);
        }
        parentToChildren.get(property.parentId)?.push(property.id);
        
        // Mark the parent ID for later
        parentIds.add(property.parentId);
        
        // Add to sibling groups
        if (!siblingGroups.has(property.parentId)) {
          siblingGroups.set(property.parentId, []);
        }
        if (!siblingGroups.get(property.parentId)?.includes(property.id)) {
          siblingGroups.get(property.parentId)?.push(property.id);
        }
      }
    });
    
    // Return the optimized data structure
    return {
      parentIds,
      childToParent,
      parentToChildren,
      siblingGroups,
      
      // Helper method to get all related properties for a given property
      getRelatedProperties(propertyId: string): string[] {
        // If this is a parent property, return its children
        if (parentIds.has(propertyId)) {
          return parentToChildren.get(propertyId) || [];
        }
        
        // If this is a child property, return its parent
        if (childToParent.has(propertyId)) {
          const parentId = childToParent.get(propertyId);
          return parentId ? [parentId] : [];
        }
        
        // Not related to any other property
        return [];
      },
      
      // Helper method to check if properties are related
      arePropertiesRelated(propertyId1: string, propertyId2: string): boolean {
        // Direct parent-child relationship
        if (childToParent.get(propertyId1) === propertyId2 || 
            childToParent.get(propertyId2) === propertyId1) {
          return true;
        }
        
        // Sibling relationship (same parent)
        const parent1 = childToParent.get(propertyId1);
        const parent2 = childToParent.get(propertyId2);
        if (parent1 && parent1 === parent2) {
          return true;
        }
        
        return false;
      }
    };
  }, [properties]);
}
