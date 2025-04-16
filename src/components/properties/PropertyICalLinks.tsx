
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import ICalLinkCard from '@/components/ical/ICalLinkCard';
import { getICalLinksForProperty, syncICalLink } from '@/services/icalLinkService';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    toast({
      title: "Sincronizando calendarios",
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
        toast({
          title: "Sincronización completada",
          description: `Se sincronizaron exitosamente ${success} calendarios.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sincronización parcial",
          description: `${success} calendarios sincronizados, ${failed} fallaron.`
        });
      }
      
      // Refresh the iCal links data
      refetch();
      
    } catch (error) {
      console.error("Error syncing all calendars:", error);
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: "Ocurrió un error al sincronizar los calendarios."
      });
    } finally {
      setSyncingAll(false);
    }
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
      </CardContent>
    </Card>
  );
};

export default PropertyICalLinks;
