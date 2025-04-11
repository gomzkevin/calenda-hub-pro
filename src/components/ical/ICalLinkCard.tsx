
import React, { useEffect, useState } from 'react';
import { ExternalLink, Trash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ICalLink, Property } from '@/types';
import { getPropertyById } from '@/services/propertyService';
import { syncICalLink } from '@/services/icalLinkService';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

interface ICalLinkCardProps {
  icalLink: ICalLink;
  onSyncComplete?: () => void;
}

const ICalLinkCard: React.FC<ICalLinkCardProps> = ({ icalLink, onSyncComplete }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const propertyData = await getPropertyById(icalLink.propertyId);
        setProperty(propertyData);
      } catch (error) {
        console.error('Error fetching property:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar propiedad",
          description: "No pudimos cargar los detalles de la propiedad."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperty();
  }, [icalLink.propertyId]);
  
  const refreshICalLink = async () => {
    setIsSyncing(true);
    toast({
      title: "Sincronizando calendario",
      description: "Esto puede tardar unos momentos..."
    });
    
    try {
      const result = await syncICalLink(icalLink);
      
      if (result.success && result.results) {
        toast({
          title: "Calendario sincronizado",
          description: `Se encontraron ${result.results.total} eventos. ${result.results.added} nuevas reservas añadidas, ${result.results.updated} actualizadas.`
        });
        
        // Invalidate reservations queries to refresh the calendar
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        console.error('Error syncing iCal:', result.error);
        toast({
          variant: "destructive",
          title: "Error al sincronizar",
          description: result.error || "No se pudieron sincronizar las reservas."
        });
      }
    } catch (error) {
      console.error('Error syncing iCal:', error);
      toast({
        variant: "destructive",
        title: "Error al sincronizar",
        description: "Ocurrió un error al sincronizar el calendario."
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const getLastSyncedText = () => {
    if (!icalLink.lastSynced) return "Nunca sincronizado";
    
    return `Última sincronización: ${formatDistanceToNow(icalLink.lastSynced, { 
      addSuffix: true,
      locale: es
    })}`;
  };
  
  if (isLoading) {
    return (
      <Card className="opacity-70">
        <CardHeader className="pb-2">
          <div className="animate-pulse h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="animate-pulse h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="animate-pulse h-3 bg-gray-200 rounded w-1/3"></div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-24"></div>
          <div className="flex space-x-2">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-8"></div>
            <div className="animate-pulse h-8 bg-gray-200 rounded w-8"></div>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 bg-platform-${icalLink.platform.toLowerCase()}`} />
          {icalLink.platform}
        </CardTitle>
        <div className="text-sm font-medium">{property?.name || 'Propiedad desconocida'}</div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm truncate text-gray-500" title={icalLink.url}>
          {icalLink.url}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {getLastSyncedText()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(icalLink.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Abrir URL
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshICalLink} 
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ICalLinkCard;
