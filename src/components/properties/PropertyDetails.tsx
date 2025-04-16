
import React from 'react';
import { Building2, BedDouble, Bath, Users, Home, Link, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { toast } from 'sonner';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  const copyICalUrl = () => {
    if (property.ical_token) {
      const icalUrl = `https://akqzaaniiflyxfrzipqq.supabase.co/functions/v1/generate-ical?propertyId=${property.id}&token=${property.ical_token}`;
      navigator.clipboard.writeText(icalUrl);
      toast.success('URL del calendario copiada al portapapeles');
    }
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

          {property.ical_token && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Calendario iCal para Reservas Manuales
              </h3>
              <Button
                variant="outline"
                className="gap-2"
                onClick={copyICalUrl}
              >
                <Link className="w-4 h-4" />
                Copiar URL del Calendario iCal
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Usa este enlace para importar las reservas manuales de esta propiedad en otros calendarios.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetails;
