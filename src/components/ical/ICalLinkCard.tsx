
import React, { useEffect, useState } from 'react';
import { ExternalLink, Trash, RefreshCw, AlertTriangle, Calendar, User, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ICalLink, Property } from '@/types';
import { getPropertyById } from '@/services/propertyService';
import { processICalLink, syncICalLink, getCachedICalData } from '@/services/icalLinkService';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Reservation {
  checkIn: string;
  checkOut: string;
  platform: string;
  status: string;
  reservationId: string;
  additionalInfo?: any;
}

interface ICalProcessResult {
  reservations: Reservation[];
  metadata: {
    totalReservations: number;
    calendarSource: string;
    processedAt: string;
  };
}

interface ICalLinkCardProps {
  icalLink: ICalLink;
  onSyncComplete?: () => void;
  onDelete?: (id: string) => void;
}

const ICalLinkCard: React.FC<ICalLinkCardProps> = ({ icalLink, onSyncComplete, onDelete }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [icalDetails, setIcalDetails] = useState<ICalProcessResult | null>(null);
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
    
    // Try to load cached iCal data on component mount
    const cachedData = getCachedICalData(icalLink.url);
    if (cachedData) {
      setIcalDetails(cachedData);
    }
  }, [icalLink.propertyId, icalLink.url]);
  
  const processICalData = async () => {
    setIsProcessing(true);
    setSyncError(null);
    
    try {
      console.log("Procesando calendario:", icalLink.url);
      const data = await processICalLink(icalLink.url);
      console.log("Datos recibidos:", data);
      setIcalDetails(data);
      return data;
    } catch (error) {
      console.error('Error processing iCal data:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setSyncError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error al procesar el calendario",
        description: "Ocurrió un error al procesar la información del calendario."
      });
      setIcalDetails(null);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const refreshICalLink = async () => {
    setIsSyncing(true);
    setSyncError(null);
    
    // First, process the iCal data to get detailed information
    try {
      console.log("Iniciando sincronización para:", icalLink);
      toast({
        title: "Sincronizando calendario",
        description: "Obteniendo datos del calendario..."
      });
      
      const processedData = await processICalData();
      
      // If processing failed, stop here
      if (!processedData) {
        setIsSyncing(false);
        return;
      }
      
      toast({
        title: "Sincronizando calendario",
        description: `Encontradas ${processedData.reservations.length} reservas. Actualizando base de datos...`
      });
      
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
        setSyncError(result.error || "Error desconocido");
        toast({
          variant: "destructive",
          title: "Error al sincronizar",
          description: result.error || "No se pudieron sincronizar las reservas."
        });
      }
    } catch (error) {
      console.error('Error syncing iCal:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setSyncError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error al sincronizar",
        description: "Ocurrió un error al sincronizar el calendario."
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(icalLink.id);
    }
  };
  
  const getLastSyncedText = () => {
    if (!icalLink.lastSynced) return "Nunca sincronizado";
    
    return `Última sincronización: ${formatDistanceToNow(icalLink.lastSynced, { 
      addSuffix: true,
      locale: es
    })}`;
  };
  
  const viewCalendarDetails = async () => {
    if (icalDetails) {
      // If we already have details, show them
      showCalendarDetailsToast(icalDetails);
    } else {
      // Otherwise process the data first
      setIsProcessing(true);
      toast({
        title: "Procesando calendario",
        description: "Obteniendo detalles del calendario..."
      });
      
      try {
        console.log("Procesando calendario para detalles:", icalLink.url);
        const data = await processICalData();
        
        if (data) {
          showCalendarDetailsToast(data);
        }
      } catch (error) {
        console.error("Error al procesar detalles:", error);
        toast({
          variant: "destructive",
          title: "Error en detalles",
          description: "No se pudieron obtener los detalles del calendario."
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const showCalendarDetailsToast = (data: ICalProcessResult) => {
    // Format the reservation details for display
    const upcomingReservations = data.reservations
      .filter(r => new Date(r.checkIn) >= new Date())
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
      .slice(0, 3);
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy', { locale: es });
    };
    
    let detailsMessage = `${data.metadata.totalReservations} reservaciones encontradas en ${data.metadata.calendarSource}.\n\n`;
    
    if (upcomingReservations.length > 0) {
      detailsMessage += "Próximas reservaciones:\n";
      upcomingReservations.forEach((res, index) => {
        detailsMessage += `${index + 1}. ${formatDate(res.checkIn)} - ${formatDate(res.checkOut)}`;
        if (res.additionalInfo?.guestName) {
          detailsMessage += ` (${res.additionalInfo.guestName})`;
        }
        detailsMessage += "\n";
      });
    } else {
      detailsMessage += "No hay reservaciones próximas.";
    }
    
    toast({
      title: "Detalles del Calendario",
      description: detailsMessage,
      duration: 10000, // Longer duration for reading
    });
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
    <Card className={syncError ? "border-red-300" : ""}>
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
        <div className="text-xs text-gray-400 mt-1 flex items-center">
          {syncError ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-red-500">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Error de sincronización
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{syncError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            getLastSyncedText()
          )}
        </div>
        
        {icalDetails && (
          <div className="mt-2 border-t pt-2 text-xs">
            <div className="flex items-center text-gray-600 mb-1">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{icalDetails.metadata.totalReservations} reservaciones</span>
            </div>
            {icalDetails.reservations.length > 0 && icalDetails.reservations[0].additionalInfo?.guestName && (
              <div className="flex items-center text-gray-600">
                <User className="w-3 h-3 mr-1" />
                <span>Próximo huésped: {icalDetails.reservations[0].additionalInfo.guestName}</span>
              </div>
            )}
            {icalDetails.reservations.length > 0 && icalDetails.reservations[0].additionalInfo?.phoneLastDigits && (
              <div className="flex items-center text-gray-600">
                <PhoneCall className="w-3 h-3 mr-1" />
                <span>Teléfono: XXXX-{icalDetails.reservations[0].additionalInfo.phoneLastDigits}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(icalLink.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={viewCalendarDetails}
            disabled={isProcessing}
          >
            <Calendar className={`w-4 h-4 mr-1 ${isProcessing ? "animate-spin" : ""}`} />
            Detalles
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshICalLink} 
            disabled={isSyncing || isProcessing}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing || isProcessing ? "animate-spin" : ""}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ICalLinkCard;
