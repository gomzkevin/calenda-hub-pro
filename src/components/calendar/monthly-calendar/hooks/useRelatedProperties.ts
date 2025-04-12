
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPropertyById } from '@/services/propertyService';
import { getChildPropertyIds } from '@/services/reservation/propertyRelations';

export const useRelatedProperties = (propertyId?: string) => {
  const [relatedPropertyIds, setRelatedPropertyIds] = useState<string[]>([]);
  
  // Fetch property details to determine if it's a parent or child
  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => propertyId ? getPropertyById(propertyId) : null,
    enabled: !!propertyId
  });

  // Fetch related property IDs (parent/children) for handling relationship blocks
  useEffect(() => {
    const fetchRelatedProperties = async () => {
      if (!propertyId) return;
      
      try {
        let relatedIds: string[] = [];
        
        // If this is a parent property, get all its children
        if (property?.type === 'parent') {
          const childIds = await getChildPropertyIds(propertyId);
          relatedIds = [...childIds];
        } 
        // If this is a child property, get its parent and siblings
        else if (property?.type === 'child' && property?.parentId) {
          const parentId = property.parentId;
          const childIds = await getChildPropertyIds(parentId);
          
          // Add parent and all siblings except self
          relatedIds = [parentId, ...childIds.filter(id => id !== propertyId)];
        }
        
        setRelatedPropertyIds(relatedIds);
      } catch (error) {
        console.error('Error fetching related properties:', error);
      }
    };
    
    if (property) {
      fetchRelatedProperties();
    }
  }, [propertyId, property]);

  return { relatedPropertyIds, property };
};
