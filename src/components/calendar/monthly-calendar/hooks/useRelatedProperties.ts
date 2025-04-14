
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPropertyById } from '@/services/propertyService';
import { getChildPropertyIds, getParentPropertyId } from '@/services/reservation/propertyRelations';

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
          console.log('This is a parent property, fetching children');
          const childIds = await getChildPropertyIds(propertyId);
          console.log('Child IDs:', childIds);
          relatedIds = [...childIds];
        } 
        // If this is a child property, get its parent only (NOT siblings)
        else if (property?.type === 'child' && property?.parentId) {
          console.log('This is a child property, fetching parent only');
          const parentId = property.parentId;
          relatedIds = [parentId];
          
          // We intentionally do NOT get siblings here
          console.log('Parent ID:', parentId, 'NOT fetching siblings');
        }
        
        console.log('Final related property IDs:', relatedIds);
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
