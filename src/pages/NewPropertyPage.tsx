
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/services/supabaseService';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Esquema de validación para el formulario
const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

const NewPropertyPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      internalCode: '',
      bedrooms: 1,
      bathrooms: 1,
      capacity: 2,
      type: '',
      description: '',
      notes: '',
      imageUrl: ''
    }
  });

  const createProperty = async (data: FormValues) => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.operatorId) {
      throw new Error('No se pudo identificar el operador del usuario actual');
    }

    const { data: newProperty, error } = await supabase
      .from('properties')
      .insert({
        name: data.name,
        address: data.address,
        internal_code: data.internalCode,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        capacity: data.capacity,
        type: data.type || null,
        description: data.description || null,
        notes: data.notes || null,
        image_url: data.imageUrl || null,
        operator_id: currentUser.operatorId
      })
      .select()
      .single();

    if (error) throw error;
    return newProperty;
  };

  const mutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      toast({
        title: "Propiedad creada",
        description: "La propiedad ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate('/properties');
    },
    onError: (error) => {
      console.error('Error al crear la propiedad:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la propiedad. Por favor intenta de nuevo.",
      });
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Crear Nueva Propiedad</h1>
        <p className="text-muted-foreground">Añade una nueva propiedad a tu organización</p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
          <CardDescription>
            Completa el formulario con la información de la propiedad que deseas añadir
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <FormDescription>URL de una imagen representativa de la propiedad</FormDescription>
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

              <CardFooter className="flex justify-between px-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/properties')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Guardando...' : 'Guardar Propiedad'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPropertyPage;
