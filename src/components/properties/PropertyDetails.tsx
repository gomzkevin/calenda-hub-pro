
import React from 'react';
import { Building2, BedDouble, Bath, Users, Home, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  
  const generateICalToken = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({ 
          ical_token: crypto.randomUUID().replace(/-/g, '') 
        })
        .eq('id', property.id)
        .select('ical_token')
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Token generado",
        description: "El token iCal ha sido generado correctamente"
      });
      
      // Reload the page to show the new token
      window.location.reload();
      
    } catch (error) {
      console.error('Error generating iCal token:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el token iCal"
      });
    }
  };
  
  // Create a base URL for the iCal feed that points to our Edge Function
  const getICalFeedUrl = () => {
    if (!property.icalToken) return null;
    
    const baseUrl = import.meta.env.PROD 
      ? "https://akqzaaniiflyxfrzipqq.supabase.co/functions/v1/calendar/export"
      : "http://localhost:54321/functions/v1/calendar/export";
    
    return `${baseUrl}/${property.icalToken}.ics`;
  };

  const icalUrl = getICalFeedUrl();
  
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
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Exportar Calendario (iCal)
              </h3>
              
              {!property.icalToken && (
                <Button 
                  size="sm" 
                  onClick={generateICalToken}
                >
                  Generar Token
                </Button>
              )}
            </div>
            
            {property.icalToken ? (
              <div className="mt-2">
                <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                  {icalUrl}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(icalUrl);
                      toast({
                        title: "Enlace copiado",
                        description: "El enlace ha sido copiado al portapapeles"
                      });
                    }}
                  >
                    Copiar Enlace
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateICalToken}
                  >
                    Regenerar Token
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Comparte este enlace en Airbnb, Booking, o cualquier otra plataforma para sincronizar disponibilidad.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Genera un token para crear un enlace iCal exportable para esta propiedad.
              </p>
            )}
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
