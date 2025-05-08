
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getICalLinksForProperty, syncICalLink } from '@/services/icalLinkService';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, ExternalLink, Trash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteICalLink } from '@/services/icalLinkService';

interface PropertyICalLinksProps {
  propertyId: string;
}

const PropertyICalLinks: React.FC<PropertyICalLinksProps> = ({ propertyId }) => {
  const navigate = useNavigate();
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get iCal links for this property
  const { data: icalLinks, isLoading: isIcalLoading, refetch } = useQuery({
    queryKey: ['propertyICalLinks', propertyId],
    queryFn: () => getICalLinksForProperty(propertyId),
    enabled: !!propertyId
  });

  const getPlatformBadgeVariant = (platform: string) => {
    switch (platform) {
      case 'Airbnb': return 'destructive';
      case 'Booking': return 'default';
      case 'Vrbo': return 'secondary';
      default: return 'outline';
    }
  };

  const handleSyncSingle = async (id: string) => {
    const link = icalLinks?.find(l => l.id === id);
    if (!link) return;
    
    setSyncingId(id);
    try {
      toast({
        title: "Sincronizando calendario",
        description: "Obteniendo reservas desde el origen..."
      });
      
      const result = await syncICalLink(link);
      
      if (result.success && result.results) {
        toast({
          title: "Calendario sincronizado",
          description: `Se encontraron ${result.results.total} eventos. ${result.results.added} nuevas reservas añadidas, ${result.results.updated} actualizadas.`
        });
        refetch();
      } else {
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
        title: "Error de sincronización",
        description: "Ocurrió un error al sincronizar el calendario."
      });
    } finally {
      setSyncingId(null);
    }
  };
  
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
  
  const openDeleteDialog = (id: string) => {
    setLinkToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteICalLink(linkToDelete);
      if (success) {
        toast({
          title: "Enlace iCal eliminado",
          description: "El enlace iCal ha sido eliminado correctamente."
        });
        refetch();
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: "No se pudo eliminar el enlace iCal. Intenta de nuevo."
        });
      }
    } catch (error) {
      console.error('Error deleting iCal link:', error);
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "Ocurrió un error al eliminar el enlace iCal."
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getLastSyncedText = (lastSynced?: Date) => {
    if (!lastSynced) return "Nunca";
    
    return formatDistanceToNow(lastSynced, { 
      addSuffix: true,
      locale: es
    });
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Última sincronización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {icalLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <Badge variant={getPlatformBadgeVariant(link.platform)}>
                      {link.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="max-w-xs truncate text-xs sm:text-sm" title={link.url}>
                        {link.url}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getLastSyncedText(link.lastSynced)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSyncSingle(link.id)}
                        disabled={syncingId === link.id}
                      >
                        <RefreshCw 
                          className={`h-4 w-4 ${syncingId === link.id ? "animate-spin" : ""}`} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/properties/${propertyId}/ical-links/edit/${link.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => openDeleteDialog(link.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este enlace iCal?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)} 
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PropertyICalLinks;
