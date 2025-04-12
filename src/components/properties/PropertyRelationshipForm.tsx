
import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Property, PropertyType } from '@/types';
import { 
  getPropertiesForRelation, 
  setPropertyRelationship,
  getChildProperties
} from '@/services/propertyService';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const relationshipFormSchema = z.object({
  type: z.enum(['standalone', 'parent', 'child']),
  parentId: z.string().optional().nullable()
});

type RelationshipFormValues = z.infer<typeof relationshipFormSchema>;

interface PropertyRelationshipFormProps {
  property: Property;
  onSaved?: () => void;
}

const PropertyRelationshipForm: React.FC<PropertyRelationshipFormProps> = ({ 
  property,
  onSaved
}) => {
  const queryClient = useQueryClient();
  
  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(relationshipFormSchema),
    defaultValues: {
      type: (property.type as 'standalone' | 'parent' | 'child') || 'standalone',
      parentId: property.parentId || null
    }
  });
  
  const type = form.watch('type');
  
  // Fetch available properties for relationships
  const { data: availableProperties = [] } = useQuery({
    queryKey: ['properties-for-relation', property.id],
    queryFn: () => getPropertiesForRelation(property.id),
    enabled: !!(property.id)
  });
  
  // Fetch child properties if this is a parent
  const { data: childProperties = [] } = useQuery({
    queryKey: ['child-properties', property.id],
    queryFn: () => getChildProperties(property.id),
    enabled: type === 'parent' && !!(property.id)
  });
  
  // Mutation for updating property relationship
  const updateRelationshipMutation = useMutation({
    mutationFn: async (values: RelationshipFormValues) => {
      return setPropertyRelationship(
        property.id,
        values.type === 'child' ? values.parentId || undefined : undefined,
        values.type as PropertyType
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
      queryClient.invalidateQueries({ queryKey: ['child-properties', property.id] });
      toast.success('Property relationship updated successfully');
      if (onSaved) onSaved();
    },
    onError: (error) => {
      console.error('Error updating property relationship:', error);
      toast.error('Failed to update property relationship');
    }
  });
  
  const onSubmit = (values: RelationshipFormValues) => {
    updateRelationshipMutation.mutate(values);
  };
  
  // Reset form when property changes
  useEffect(() => {
    form.reset({
      type: (property.type as 'standalone' | 'parent' | 'child') || 'standalone',
      parentId: property.parentId || null
    });
  }, [property, form]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Relationship Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standalone">Standalone Property</SelectItem>
                    <SelectItem value="parent">Parent Property (with Rooms)</SelectItem>
                    <SelectItem value="child">Room (part of a Property)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {type === 'child' && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Property</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent property" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProperties.map(prop => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {type === 'parent' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Associated Rooms:</h4>
            {childProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rooms associated yet. Create a room property and select this as its parent.</p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {childProperties.map(child => (
                  <li key={child.id} className="text-sm">
                    {child.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        <Button type="submit" disabled={updateRelationshipMutation.isPending}>
          {updateRelationshipMutation.isPending ? 'Saving...' : 'Save Relationship'}
        </Button>
      </form>
    </Form>
  );
};

export default PropertyRelationshipForm;
