
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getICalLinks, syncAllICalLinks } from '@/services/icalLinkService';
import { getProperties } from '@/services/propertyService';
import { toast } from 'sonner';
import { Property, ICalLink } from '@/types';
import ICalLinksTable from '@/components/ical/ICalLinksTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ICalLinksPage = () => {
  const navigate = useNavigate();
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  
  const { data: icalLinks, isLoading: isIcalLoading, error: icalError, refetch: refetchIcal } = useQuery({
    queryKey: ['icalLinks'],
    queryFn: getICalLinks
  });
  
  const { data: properties, isLoading: isPropertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    toast.info("Sincronizando todos los calendarios", {
      description: "Este proceso puede tomar unos momentos..."
    });
    
    try {
      const result = await syncAllICalLinks();
      
      if (result.success) {
        if (result.failed === 0) {
          toast.success("Sincronización completada", {
            description: `${result.syncedSuccessfully} de ${result.totalLinks} calendarios sincronizados correctamente.`
          });
        } else {
          toast.warning("Sincronización parcial", {
            description: `${result.syncedSuccessfully} calendarios sincronizados, ${result.failed} fallaron.`
          });
        }
      } else {
        toast.error("Error de sincronización", {
          description: result.error || "Ocurrió un error al sincronizar los calendarios."
        });
      }
      
      // Refetch data to update UI
      refetchIcal();
    } catch (error) {
      console.error("Error syncing all calendars:", error);
      toast.error("Error de sincronización", {
        description: "Ocurrió un error al sincronizar los calendarios."
      });
    } finally {
      setIsSyncingAll(false);
    }
  };
  
  const isLoading = isIcalLoading || isPropertiesLoading;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-alanto-forest"></div>
      </div>
    );
  }
  
  if (icalError) {
    toast.error("Error al cargar enlaces iCal", {
      description: "No pudimos cargar los enlaces iCal. Por favor intenta de nuevo."
    });
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">No se pudieron cargar los enlaces iCal</h3>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Enlaces iCal</h1>
        <div className="flex space-x-3">
          {icalLinks && icalLinks.length > 0 && (
            <Button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>Sincronizar Todos</span>
            </Button>
          )}
          <Button
            onClick={() => navigate('/ical-links/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir Enlace iCal</span>
          </Button>
        </div>
      </div>
      
      {icalLinks && icalLinks.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Enlaces de calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <ICalLinksTable 
              icalLinks={icalLinks} 
              properties={properties || []} 
              onRefetch={refetchIcal}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 bg-alanto-forest-pale rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-alanto-forest">No hay enlaces iCal</h3>
          <p className="text-alanto-forest-dark mb-4">
            Añade enlaces iCal para sincronizar las reservas de tus propiedades.
          </p>
          <Button 
            onClick={() => navigate('/ical-links/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir tu primer enlace iCal</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ICalLinksPage;
