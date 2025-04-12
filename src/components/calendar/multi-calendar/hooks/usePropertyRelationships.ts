
import { useMemo } from 'react';
import { Property } from '@/types';

export const usePropertyRelationships = (properties: Property[]) => {
  // Create property relationship maps
  const propertyRelationships = useMemo(() => {
    const relationships = new Map<string, string[]>();
    const childToParent = new Map<string, string>();
    
    properties.forEach(property => {
      if (property.type === 'parent') {
        relationships.set(property.id, []);
      } else if (property.type === 'child' && property.parentId) {
        const children = relationships.get(property.parentId) || [];
        children.push(property.id);
        relationships.set(property.parentId, children);
        
        childToParent.set(property.id, property.parentId);
      }
    });
    
    return { parentToChildren: relationships, childToParent };
  }, [properties]);

  return propertyRelationships;
};
