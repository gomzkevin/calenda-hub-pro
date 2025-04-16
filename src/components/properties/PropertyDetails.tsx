
import React, { useState } from 'react';
import { Building2, BedDouble, Bath, Users, Home, Calendar, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // Create a base URL for the iCal feed
  const getICalFeedUrl = () => {
    if (!property.icalToken) return null;
    
    const baseUrl = import.meta.env.PROD 
      ? "https://akqzaaniiflyxfrzipqq.supabase.co/functions/v1/calendar/export"
      : "http://localhost:54321/functions/v1/calendar/export";
    
    return `${baseUrl}/${property.icalToken}.ics`;
  };

  const icalUrl = getICalFeedUrl();
  
  const generateICalToken = async () => {
    try {
      setIsGeneratingToken(true);
      
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
    } finally {
      setIsGeneratingToken(false);
    }
  };
  
  const copyICalUrl = async () => {
    if (!icalUrl) return;
    
    try {
      await navigator.clipboard.writeText(icalUrl);
      setIsCopied(true);
      
      toast({
        title: "Copiado",
        description: "Enlace iCal copiado al portapapeles"
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar al portapapeles"
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
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Exportar Calendario (iCal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!property.icalToken ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Genera un token para crear un enlace iCal exportable para esta propiedad.
                    Este enlace te permitirá sincronizar las reservas manuales con otras plataformas.
                  </p>
                  <Button 
                    onClick={generateICalToken}
                    disabled={isGeneratingToken}
                  >
                    {isGeneratingToken ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Generando...
                      </>
                    ) : (
                      <>Generar Token</>
                    )}
                  </Button>
                </div>
              ) : (
                <div>
                  <label htmlFor="ical-url" className="block text-sm font-medium mb-1.5">
                    URL para sincronización (iCal)
                  </label>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-grow">
                      <input 
                        id="ical-url"
                        type="text" 
                        value={icalUrl || ''} 
                        readOnly 
                        className="w-full bg-muted p-2 pr-10 rounded text-sm border"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={copyICalUrl}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        isCopied && "bg-green-50 text-green-600 border-green-200"
                      )}
                      aria-label="Copiar URL del iCal"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">
                      <strong>Importante:</strong> Este enlace solo sincroniza las reservas de tipo "Manual" creadas en esta plataforma.
                    </p>
                    <p>Comparte este enlace en Airbnb, Booking o cualquier otra plataforma para sincronizar disponibilidad.</p>
                    <p className="mt-2 text-xs">
                      Consejo: Algunos sistemas requieren que pegues esta URL exactamente como aparece.
                    </p>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={generateICalToken}
                      disabled={isGeneratingToken}
                      size="sm"
                    >
                      {isGeneratingToken ? 'Regenerando...' : 'Regenerar Token'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
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
