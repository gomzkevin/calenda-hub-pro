
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ICalLinkCard from '@/components/ical/ICalLinkCard';
import { getICalLinksForProperty, syncICalLink } from '@/services/icalLinkService';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

interface PropertyICalLinksProps {
  propertyId: string;
}

const PropertyICalLinks: React.FC<PropertyICalLinksProps> = ({ propertyId }) => {
  const navigate = useNavigate();
  const [syncingAll, setSyncingAll] = useState(false);
  
  // Get iCal links for this property
  const { data: icalLinks, isLoading: isIcalLoading, refetch } = useQuery({
    queryKey: ['propertyICalLinks', propertyId],
    queryFn: () => getICalLinksForProperty(propertyId),
    enabled: !!propertyId
  });

  // Function to sync all iCal links for this property
  const syncAllICalLinks = async () => {
    if (!icalLinks || icalLinks.length === 0) return;
    
    setSyncingAll(true);
    toast("Sincronizando calendarios", {
      description: `Iniciando sincronización de ${icalLinks.length} calendarios...`
    });
    
    try {
      let success = 0;
      let failed = 0;
      
      for (const link of icalLinks) {
        try {
          const result = await syncICalLink(link);
          if (result.success) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error syncing calendar ${link.url}:`, error);
          failed++;
        }
      }
      
      if (failed === 0) {
        toast("Sincronización completada", {
          description: `Se sincronizaron exitosamente ${success} calendarios.`
        });
      } else {
        toast.error("Sincronización parcial", {
          description: `${success} calendarios sincronizados, ${failed} fallaron.`
        });
      }
      
      // Refresh the iCal links data
      refetch();
      
    } catch (error) {
      console.error("Error syncing all calendars:", error);
      toast.error("Error de sincronización", {
        description: "Ocurrió un error al sincronizar los calendarios."
      });
    } finally {
      setSyncingAll(false);
    }
  };
  
  // Get the property from the Supabase database
  const { data: property, isLoading: isPropertyLoading } = useQuery({
    queryKey: ['propertyICalToken', propertyId],
    queryFn: async () => {
      const supabaseUrl = 'https://akqzaaniiflyxfrzipqq.supabase.co';
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=ical_token`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcXphYW5paWZseXhmcnppcHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjYwMjUsImV4cCI6MjA1OTkwMjAyNX0.P-LD-Gg_tGih4pKGZxxEu3DtySmYObgqhxXOyTddWiY',
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return data && data.length > 0 ? data[0] : null;
      } catch (error) {
        console.error("Error fetching property ical token:", error);
        return null;
      }
    },
    enabled: !!propertyId
  });
  
  // Show a nice input with the iCal URL for this property
  const renderCalendarExportSection = () => {
    if (!property?.ical_token) return null;
    
    const supabaseUrl = 'https://akqzaaniiflyxfrzipqq.supabase.co';
    
    // Use the calendar/export endpoint with correct URL format for better compatibility
    const calendarUrl = `${supabaseUrl}/functions/v1/calendar/export?t=${property.ical_token}`;
    
    return (
      <div className="space-y-4 mt-4 border-t pt-4">
        <h3 className="text-sm font-medium">URL de Exportación de Calendario</h3>
        <p className="text-xs text-muted-foreground">
          Comparte esta URL con plataformas como Airbnb, Booking.com o VRBO para sincronizar las reservas de esta propiedad.
        </p>
        <div className="flex w-full items-center space-x-2">
          <Input 
            readOnly 
            value={calendarUrl} 
            className="font-mono text-xs"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(calendarUrl);
              toast("URL copiada", {
                description: "URL de calendario copiada al portapapeles"
              });
            }}
          >
            Copiar
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Enlaces de Calendario
        </CardTitle>
        <div className="flex space-x-2">
          {icalLinks && icalLinks.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={syncAllICalLinks}
                    disabled={syncingAll}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncingAll ? "animate-spin" : ""}`} />
                    Sincronizar Todos
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sincronizar todos los calendarios</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button size="sm" onClick={() => navigate(`/properties/${propertyId}/ical-links/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir Calendario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isIcalLoading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : icalLinks && icalLinks.length > 0 ? (
          <div className="space-y-4">
            {icalLinks.map((icalLink) => (
              <ICalLinkCard 
                key={icalLink.id} 
                icalLink={icalLink} 
                onSyncComplete={() => refetch()}
              />
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
        
        {isPropertyLoading ? (
          <div className="py-4 flex justify-center mt-4 border-t pt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          renderCalendarExportSection()
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyICalLinks;
