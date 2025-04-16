
import React from 'react';
import { Building2, BedDouble, Bath, Users, Home, Calendar, Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateICalToken } from '@/services/propertyService';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  const queryClient = useQueryClient();
  
  const generateTokenMutation = useMutation({
    mutationFn: (propertyId: string) => generateICalToken(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
      toast.success('Token de calendario generado correctamente');
    },
    onError: (error) => {
      console.error('Error generating iCal token:', error);
      toast.error('Error al generar el token de calendario');
    }
  });
  
  const copyICalUrl = () => {
    if (property.ical_token) {
      // New format with .ics extension
      const icalUrl = `https://akqzaaniiflyxfrzipqq.supabase.co/functions/v1/generate-ical/${property.id}-${property.ical_token}.ics`;
      navigator.clipboard.writeText(icalUrl);
      toast.success('URL del calendario copiada al portapapeles');
    } else {
      toast.error('No se ha generado un token de calendario para esta propiedad');
    }
  };

  const handleGenerateToken = () => {
    generateTokenMutation.mutate(property.id);
  };

  return (
    <div className="space-y-6">
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
              <p className="text-muted-foreground flex items-center">
                <Home className="w-4 h-4 mr-2" />
                {property.type || 'No especificado'}
              </p>
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

          <div className="mt-6 pt-4 border-t">
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Calendario iCal para Reservas Manuales
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3">
              Este enlace iCal <strong>solo contiene las reservas manuales</strong> (plataforma "Other") 
              para compartir con otros sistemas.
            </p>
            
            {property.ical_token ? (
              <Button
                variant="outline"
                className="gap-2"
                onClick={copyICalUrl}
              >
                <Copy className="w-4 h-4" />
                Copiar URL del Calendario iCal (.ics)
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Esta propiedad no tiene un token de calendario generado.
                </p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleGenerateToken}
                  disabled={generateTokenMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 ${generateTokenMutation.isPending ? 'animate-spin' : ''}`} />
                  {generateTokenMutation.isPending ? 'Generando...' : 'Generar Token de Calendario'}
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-2">
              Usa este enlace para importar las reservas manuales de esta propiedad en otros calendarios.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetails;
