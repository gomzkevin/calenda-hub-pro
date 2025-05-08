
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPropertyById } from '@/services/propertyService';
import { getChildPropertyIds, getParentPropertyId } from '@/services/reservation/propertyRelations';
import { Property } from '@/types';

export const useRelatedProperties = (propertyId?: string) => {
  const [relatedPropertyIds, setRelatedPropertyIds] = useState<string[]>([]);
  const previousPropertyId = useRef<string | undefined>(propertyId);
  
  // Fetch property details with caching for better performance
  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => propertyId ? getPropertyById(propertyId) : null,
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch related property IDs only when propertyId changes
  useEffect(() => {
    if (propertyId !== previousPropertyId.current) {
      previousPropertyId.current = propertyId;
      
      const fetchRelatedProperties = async () => {
        if (!propertyId) {
          setRelatedPropertyIds([]);
          return;
        }
        
        try {
          const relatedIds: string[] = [];
          
          // If this is a parent property, get all its children
          if (property?.type === 'parent') {
            const childIds = await getChildPropertyIds(propertyId);
            relatedIds.push(...childIds);
          } 
          // If this is a child property, get its parent only (NOT siblings)
          else if (property?.type === 'child' && property?.parentId) {
            const parentId = property.parentId;
            relatedIds.push(parentId);
          }
          
          setRelatedPropertyIds(relatedIds);
        } catch (error) {
          console.error('Error fetching related properties:', error);
          setRelatedPropertyIds([]);
        }
      };
      
      if (property) {
        fetchRelatedProperties();
      }
    }
  }, [propertyId, property]);

  return { relatedPropertyIds, property };
};
