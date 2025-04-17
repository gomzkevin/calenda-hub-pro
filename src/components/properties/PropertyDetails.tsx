
import React, { useState } from 'react';
import { Building2, BedDouble, Bath, Users, Home, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  // Function to copy iCal URL to clipboard
  const copyICalUrl = async () => {
    try {
      if (property.id) {
        // Generate the iCal URL with the property's ID and token
        const baseUrl = window.location.origin.includes('localhost') 
          ? 'http://localhost:54321/functions/v1'
          : 'https://akqzaaniiflyxfrzipqq.supabase.co/functions/v1';
          
        const url = `${baseUrl}/generate-ical?property_id=${property.id}&token=${property.icalToken || ''}`;
        
        await navigator.clipboard.writeText(url);
        setCopying(true);
        
        toast({
          title: 'Enlace copiado',
          description: 'URL del calendario iCal copiado al portapapeles.',
        });
        
        setTimeout(() => setCopying(false), 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'Error',
        description: 'No se pudo copiar el enlace. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
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
          
          {/* iCal Export Section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Exportar Calendario (iCal)</h3>
            <div className="flex items-center">
              <p className="text-muted-foreground text-sm mr-2">
                Copie este enlace para compartir con plataformas externas (solo reservas manuales)
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyICalUrl}
                className="flex items-center"
              >
                {copying ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copying ? 'Copiado' : 'Copiar'}
              </Button>
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
  );
};

export default PropertyDetails;
