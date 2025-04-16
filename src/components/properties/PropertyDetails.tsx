import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Edit, Loader2, MapPin, Plus, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { deleteProperty, getProperty } from '@/services/propertyService';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Property } from '@/types';
import { useParams } from 'react-router-dom';
import { PropertyICalLinks } from './PropertyICalLinks';
import PropertyMap from './PropertyMap';
import PropertyGallery from './PropertyGallery';
import { PropertyICalExport } from '@/components/properties/PropertyICalExport';

interface PropertyDetailsProps {
  property?: Property;
}

const PropertyDetails = ({ property }: PropertyDetailsProps) => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  const { data: fetchedProperty, isLoading, isError, error } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getProperty(propertyId as string),
    enabled: !!propertyId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (isError || !fetchedProperty) {
    console.error("Error fetching property:", error);
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">Error al cargar la propiedad</h3>
        <p className="text-muted-foreground">
          No se pudo cargar la propiedad. Por favor, inténtelo de nuevo más tarde.
        </p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteProperty(fetchedProperty.id);
      toast({
        title: "Propiedad eliminada.",
        description: "La propiedad ha sido eliminada correctamente.",
      });
      navigate('/properties');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al eliminar la propiedad.",
        description: "No se pudo eliminar la propiedad. Por favor, inténtelo de nuevo.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{fetchedProperty.name}</h2>
          <p className="text-muted-foreground">{fetchedProperty.address}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate(`/properties/${fetchedProperty.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. ¿Estás seguro de que quieres
                  eliminar esta propiedad?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button variant="destructive" onClick={handleDelete}>
                  Eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium leading-none">Nombre</p>
              <p className="text-muted-foreground">{fetchedProperty.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Dirección</p>
              <p className="text-muted-foreground">{fetchedProperty.address}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium leading-none">Descripción</p>
            <p className="text-muted-foreground">{fetchedProperty.description}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium leading-none">Precio por noche</p>
              <p className="text-muted-foreground">
                {fetchedProperty.night_price} €
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium leading-none">Amenidades</p>
            <div className="flex flex-wrap gap-2">
              {fetchedProperty.amenities?.map((amenity, index) => (
                <Badge key={index}>{amenity}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Ubicación</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate(`/properties/${fetchedProperty.id}/map`)}>
            <MapPin className="w-4 h-4 mr-2" />
            Ver Mapa
          </Button>
        </CardHeader>
        <CardContent>
          <PropertyMap property={fetchedProperty} />
        </CardContent>
      </Card>

      <PropertyGallery propertyId={fetchedProperty.id} />
      
      <PropertyICalLinks propertyId={fetchedProperty.id} />
      
      <PropertyICalExport 
        propertyId={fetchedProperty.id}
        propertyName={fetchedProperty.name}
      />
    </div>
  );
};

export default PropertyDetails;
