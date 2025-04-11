
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  platform: z.string().min(1, { message: 'Por favor selecciona una plataforma' }),
  url: z.string().url({ message: 'Por favor ingresa una URL válida' }),
});

type FormValues = z.infer<typeof formSchema>;

const AddICalLinkPage = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId?: string }>();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: '',
      url: '',
    }
  });

  const createICalLink = async (data: FormValues) => {
    const { data: newICalLink, error } = await supabase
      .from('ical_links')
      .insert({
        property_id: propertyId,
        platform: data.platform,
        url: data.url
      })
      .select()
      .single();

    if (error) throw error;
    return newICalLink;
  };

  const mutation = useMutation({
    mutationFn: createICalLink,
    onSuccess: () => {
      toast.success('Enlace iCal añadido correctamente');
      queryClient.invalidateQueries({ queryKey: ['icalLinks'] });
      queryClient.invalidateQueries({ queryKey: ['propertyICalLinks', propertyId] });
      
      if (propertyId) {
        navigate(`/properties/${propertyId}`);
      } else {
        navigate('/ical-links');
      }
    },
    onError: (error) => {
      console.error('Error al crear enlace iCal:', error);
      toast.error('No se pudo crear el enlace iCal. Por favor intenta de nuevo.');
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  const navigateBack = () => {
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    } else {
      navigate('/ical-links');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={navigateBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Añadir Enlace iCal</h1>
        <p className="text-muted-foreground">Agrega un nuevo enlace de calendario iCal</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Detalles del Enlace iCal</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plataforma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una plataforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Airbnb">Airbnb</SelectItem>
                        <SelectItem value="Booking">Booking.com</SelectItem>
                        <SelectItem value="VRBO">VRBO</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del iCal</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/calendar.ics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-between px-0 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={navigateBack}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Guardando...' : 'Guardar Enlace iCal'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddICalLinkPage;
