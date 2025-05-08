
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useUser } from '@/hooks/use-user';
import { createProperty } from '@/services/propertyService';

const propertyFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  internalCode: z.string().min(2, {
    message: "El código interno debe tener al menos 2 caracteres.",
  }),
  address: z.string().min(2, {
    message: "La dirección debe tener al menos 2 caracteres.",
  }),
  bedrooms: z.number().min(1, {
    message: "Debe tener al menos 1 habitación.",
  }).default(1),
  bathrooms: z.number().min(1, {
    message: "Debe tener al menos 1 baño.",
  }).default(1),
  capacity: z.number().min(1, {
    message: "Debe tener al menos 1 huésped.",
  }).default(1),
  type: z.enum(['standalone', 'parent', 'child', 'Villa', 'Apartment', 'Cabin', 'Other']).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const NewPropertyPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useUser();
  
  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: "",
      internalCode: "",
      address: "",
      bedrooms: 1,
      bathrooms: 1,
      capacity: 1,
    },
  });
  
  const onSubmit = async (values: z.infer<typeof propertyFormSchema>) => {
    if (!profile) {
      toast({
        variant: "destructive",
        description: "No se encontró perfil de usuario"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare property data
      const propertyData = {
        name: values.name,
        internalCode: values.internalCode,
        address: values.address,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        capacity: values.capacity,
        operatorId: profile.operator_id, // Fixed: using operator_id instead of operatorId
        type: values.type || 'standalone',
        description: values.description || '',
        notes: values.notes || '',
      };
      
      // Call API to create property
      const result = await createProperty(propertyData);
      
      if (!result.success) {
        throw new Error(result.message || 'Error creando la propiedad');
      }
      
      toast({
        description: "Propiedad creada exitosamente"
      });
      
      // Navigate to the properties list
      navigate('/properties');
      
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Error al crear la propiedad';
      
      toast({
        variant: "destructive",
        description: message
      });
      
      console.error('Error creating property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Nueva Propiedad</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de la propiedad" {...field} />
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
                  <Input placeholder="Código interno de la propiedad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección de la propiedad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-4">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem className="w-1/3">
                  <FormLabel>Habitaciones</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Número de habitaciones"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem className="w-1/3">
                  <FormLabel>Baños</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Número de baños"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem className="w-1/3">
                  <FormLabel>Capacidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Capacidad de huéspedes"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standalone">Standalone</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Cabin">Cabin</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Elige el tipo de propiedad.
                </FormDescription>
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
                    placeholder="Descripción de la propiedad"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Breve descripción de la propiedad.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Notas adicionales sobre la propiedad.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Propiedad"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default NewPropertyPage;
