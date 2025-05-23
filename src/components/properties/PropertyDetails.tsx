
import React, { useState } from 'react';
import { Building2, BedDouble, Bath, Users, Home, Calendar, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  const [copied, setCopied] = useState(false);
  
  // Usar la URL de Supabase como URL principal
  const getSupabaseICalUrl = () => {
    const baseUrl = 'https://akqzaaniiflyxfrzipqq.supabase.co/functions/v1/generate-ical';
    
    // Si hay código interno, usarlo, de lo contrario usar el ID
    if (property.internalCode) {
      // Aseguramos la codificación correcta del código interno
      const encodedCode = encodeURIComponent(property.internalCode);
      // Formato que espera la función: /code/{codigo}.ics
      return `${baseUrl}/code/${encodedCode}.ics`;
    } else {
      // Para IDs de propiedades, usamos el formato /{id}.ics
      return `${baseUrl}/${property.id}.ics`;
    }
  };
  
  // URL alternativa (ahora como fallback)
  const getAlternativeICalUrl = () => {
    const baseUrl = 'https://app.alanto.mx/api/calendar';
    
    // Si hay código interno, usarlo, de lo contrario usar el ID
    if (property.internalCode) {
      const encodedCode = encodeURIComponent(property.internalCode);
      return `${baseUrl}?code=${encodedCode}`;
    } else {
      return `${baseUrl}?id=${property.id}`;
    }
  };
  
  const copyICalUrl = () => {
    const icalUrl = getSupabaseICalUrl();
    navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    toast.success('URL del calendario copiada al portapapeles');
    
    setTimeout(() => setCopied(false), 3000);
  };
  
  const openICalUrlInNewTab = () => {
    const icalUrl = getSupabaseICalUrl();
    window.open(icalUrl, '_blank');
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
              Calendario iCal
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3">
              Este enlace iCal contiene <strong>todas las reservas</strong> de esta propiedad
              para compartir con otros sistemas.
            </p>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={copyICalUrl}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copiar URL del Calendario
                </Button>
                
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={openICalUrlInNewTab}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir/Descargar Calendario
                </Button>
              </div>
              
              <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all border border-gray-200 text-muted-foreground">
                {getSupabaseICalUrl()}
              </div>
              
              <Tabs defaultValue="principal" className="mt-4">
                <TabsList>
                  <TabsTrigger value="principal">Enlace Principal</TabsTrigger>
                  <TabsTrigger value="alternativo">Enlace Alternativo</TabsTrigger>
                </TabsList>
                <TabsContent value="principal">
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Usa este enlace para importar las reservas de esta propiedad en Airbnb, Booking, VRBO y otros servicios.</p>
                    <p className="mt-1">URL: <code>{getSupabaseICalUrl()}</code></p>
                  </div>
                </TabsContent>
                <TabsContent value="alternativo">
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Si el enlace principal no funciona, puedes usar esta URL alternativa:</p>
                    <p className="mt-1">URL: <code>{getAlternativeICalUrl()}</code></p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetails;
