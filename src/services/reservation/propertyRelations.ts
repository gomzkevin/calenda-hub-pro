
import { getProperties } from "../propertyService";
import { Reservation } from "@/types";

// Maps to store parent-child relationships
let propertyRelationshipCache: {
  parentToChildren: Map<string, string[]>;
  childToParent: Map<string, string>;
} | null = null;

/**
 * Builds maps of parent-child property relationships
 */
export const buildPropertyRelationshipMaps = async (): Promise<{
  parentToChildren: Map<string, string[]>;
  childToParent: Map<string, string>;
}> => {
  // Use cached relationships if available
  if (propertyRelationshipCache) {
    return propertyRelationshipCache;
  }

  const properties = await getProperties();
  
  const parentToChildren = new Map<string, string[]>();
  const childToParent = new Map<string, string>();
  
  // First pass: identify parent properties
  properties.forEach(property => {
    if (property.type === 'parent') {
      parentToChildren.set(property.id, []);
    }
  });
  
  // Second pass: connect children to parents
  properties.forEach(property => {
    if (property.type === 'child' && property.parentId) {
      // Add child to parent's children list
      const children = parentToChildren.get(property.parentId) || [];
      children.push(property.id);
      parentToChildren.set(property.parentId, children);
      
      // Map child to its parent
      childToParent.set(property.id, property.parentId);
    }
  });
  
  propertyRelationshipCache = { parentToChildren, childToParent };
  return propertyRelationshipCache;
};

/**
 * Get all child property IDs for a given parent property
 */
export const getChildPropertyIds = async (parentId: string): Promise<string[]> => {
  const { parentToChildren } = await buildPropertyRelationshipMaps();
  return parentToChildren.get(parentId) || [];
};

/**
 * Get the parent property ID for a given child property
 */
export const getParentPropertyId = async (childId: string): Promise<string | null> => {
  const { childToParent } = await buildPropertyRelationshipMaps();
  return childToParent.get(childId) || null;
};

/**
 * Generate block reservations for related properties based on a source reservation
 */
export const generateRelatedPropertyBlocks = async (
  sourceReservation: Reservation
): Promise<Reservation[]> => {
  const { parentToChildren, childToParent } = await buildPropertyRelationshipMaps();
  const blocks: Reservation[] = [];
  
  // If the source reservation is on a parent property
  if (parentToChildren.has(sourceReservation.propertyId)) {
    // Create blocks for all child properties
    const childIds = parentToChildren.get(sourceReservation.propertyId) || [];
    
    for (const childId of childIds) {
      blocks.push({
        id: crypto.randomUUID(),
        propertyId: childId,
        startDate: sourceReservation.startDate,
        endDate: sourceReservation.endDate,
        source: 'Manual', // Changed from 'System' to valid ReservationSource
        platform: 'Manual', // Changed from 'System' to valid Platform
        status: 'Blocked',
        notes: 'Blocked',
        sourceReservationId: sourceReservation.id,
        createdAt: new Date()
      });
    }
  }
  
  // If the source reservation is on a child property
  const parentId = childToParent.get(sourceReservation.propertyId);
  if (parentId) {
    // Create a block for the parent property only
    blocks.push({
      id: crypto.randomUUID(),
      propertyId: parentId,
      startDate: sourceReservation.startDate,
      endDate: sourceReservation.endDate,
      source: 'Manual', // Changed from 'System' to valid ReservationSource
      platform: 'Manual', // Changed from 'System' to valid Platform
      status: 'Blocked',
      notes: 'Blocked',
      sourceReservationId: sourceReservation.id,
      createdAt: new Date()
    });
    
    // IMPORTANT: NO propagation to sibling properties
    // This is intentionally commented out to show what we're NOT doing
    // We don't want to block siblings when one child is reserved
  }
  
  return blocks;
};

/**
 * Clear relationship cache (used for testing)
 */
export const clearPropertyRelationshipCache = (): void => {
  propertyRelationshipCache = null;
};
