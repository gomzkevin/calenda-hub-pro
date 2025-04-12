
import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types';
import PropertyRelationshipForm from './PropertyRelationshipForm';

// Schema for property editing
const propertyFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  address: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
  internalCode: z.string().min(1, { message: 'El código interno es requerido' }),
  bedrooms: z.coerce.number().min(0, { message: 'Ingrese un número válido' }),
  bathrooms: z.coerce.number().min(0, { message: 'Ingrese un número válido' }),
  capacity: z.coerce.number().min(1, { message: 'La capacidad debe ser al menos 1' }),
  type: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url({ message: 'Ingrese una URL válida' }).optional().or(z.literal(''))
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyEditFormProps {
  property: Property;
  onCancel: () => void;
}

const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ property, onCancel }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  
  // Setup form for editing property
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: property.name,
      address: property.address,
      internalCode: property.internalCode,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      capacity: property.capacity,
      type: property.type || '',
      description: property.description || '',
      notes: property.notes || '',
      imageUrl: property.imageUrl || ''
    }
  });
  
  // Mutation for updating property
  const updateMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const { error } = await supabase
        .from('properties')
        .update({
          name: data.name,
          address: data.address,
          internal_code: data.internalCode,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          capacity: data.capacity,
          type: data.type || null,
          description: data.description || null,
          notes: data.notes || null,
          image_url: data.imageUrl || null
        })
        .eq('id', property.id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
      toast.success('Propiedad actualizada con éxito');
      onCancel();
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast.error('No se pudo actualizar la propiedad');
    }
  });
  
  const onSubmit = (data: PropertyFormValues) => {
    updateMutation.mutate(data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Propiedad</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="relationships">Relaciones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Casa de Playa El Palmar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Interno</FormLabel>
                        <FormControl>
                          <Input placeholder="CASA-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Calle Principal 123, Ciudad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Habitaciones</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baños</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Propiedad</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartamento, Casa, Villa, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la Imagen</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Hermosa casa con vista al mar..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Internas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información adicional para el equipo..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="relationships">
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-2">Sobre las Relaciones entre Propiedades</h4>
                <p className="text-sm text-muted-foreground">
                  Las relaciones permiten gestionar alojamientos que pueden reservarse completos o por habitaciones individuales:
                </p>
                <ul className="list-disc ml-5 mt-2 text-sm text-muted-foreground">
                  <li>Propiedad Independiente: sin relaciones con otras propiedades</li>
                  <li>Propiedad Principal: puede contener habitaciones individuales</li>
                  <li>Habitación: pertenece a una propiedad principal</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Al reservar una propiedad principal, todas sus habitaciones se bloquean automáticamente.
                </p>
              </div>
              
              <PropertyRelationshipForm 
                property={property} 
                onSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ['properties'] });
                  queryClient.invalidateQueries({ queryKey: ['property', property.id] });
                }}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PropertyEditForm;
