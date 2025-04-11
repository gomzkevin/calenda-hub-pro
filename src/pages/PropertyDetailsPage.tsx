
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  ImageIcon, 
  CalendarIcon, 
  Building2, 
  HomeIcon,
  BedDouble,
  Bath,
  Users,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPropertyById, getICalLinksForProperty } from '@/services/supabaseService';
import ICalLinkCard from '@/components/ical/ICalLinkCard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';

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

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get property data
  const { data: property, isLoading: isPropertyLoading, error: propertyError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyById(id || ''),
    enabled: !!id
  });
  
  // Get iCal links for this property
  const { data: icalLinks, isLoading: isIcalLoading } = useQuery({
    queryKey: ['propertyICalLinks', id],
    queryFn: () => getICalLinksForProperty(id || ''),
    enabled: !!id
  });
  
  // Setup form for editing property
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: '',
      address: '',
      internalCode: '',
      bedrooms: 0,
      bathrooms: 0,
      capacity: 0,
      type: '',
      description: '',
      notes: '',
      imageUrl: ''
    }
  });
  
  // Set form values when property data is loaded
  useEffect(() => {
    if (property) {
      form.reset({
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
      });
    }
  }, [property, form]);
  
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
        .eq('id', id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Propiedad actualizada con éxito');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast.error('No se pudo actualizar la propiedad');
    }
  });
  
  const onSubmit = (data: PropertyFormValues) => {
    updateMutation.mutate(data);
  };
  
  if (isPropertyLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (propertyError || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Propiedad no encontrada</h1>
        <Button onClick={() => navigate('/properties')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Propiedades
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/properties')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">{property.name}</h1>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar Propiedad</CardTitle>
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
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Imágenes de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-secondary flex items-center justify-center rounded-md">
                  {property.imageUrl ? (
                    <img 
                      src={property.imageUrl} 
                      alt={property.name} 
                      className="h-full w-full object-cover rounded-md"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Property Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Detalles de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Tipo</h3>
                    <p className="text-muted-foreground">{property.type || 'No especificado'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Dirección</h3>
                    <p className="text-muted-foreground">{property.address}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Código Interno</h3>
                    <p className="text-muted-foreground">{property.internalCode}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Habitaciones</h3>
                    <p className="text-muted-foreground flex items-center">
                      <BedDouble className="w-4 h-4 mr-1" />
                      {property.bedrooms}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Baños</h3>
                    <p className="text-muted-foreground flex items-center">
                      <Bath className="w-4 h-4 mr-1" />
                      {property.bathrooms}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Capacidad</h3>
                    <p className="text-muted-foreground flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {property.capacity} huéspedes
                    </p>
                  </div>
                </div>
                {property.description && (
                  <div className="mt-4">
                    <h3 className="font-medium">Descripción</h3>
                    <p className="text-muted-foreground">{property.description}</p>
                  </div>
                )}
                {property.notes && (
                  <div className="mt-4">
                    <h3 className="font-medium">Notas Internas</h3>
                    <p className="text-muted-foreground">{property.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Calendar Links */}
          <div>
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Enlaces de Calendario
                </CardTitle>
                <Button size="sm" onClick={() => navigate(`/properties/${id}/ical-links/new`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Calendario
                </Button>
              </CardHeader>
              <CardContent>
                {isIcalLoading ? (
                  <div className="py-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : icalLinks && icalLinks.length > 0 ? (
                  <div className="space-y-4">
                    {icalLinks.map((icalLink) => (
                      <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium">No hay Enlaces de Calendario</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Añade enlaces de calendario desde plataformas como Airbnb, Booking.com o VRBO
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsPage;
