
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, ExternalLink, RefreshCw, Trash } from 'lucide-react';
import { ICalLink, Property } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { syncICalLink, deleteICalLink } from '@/services/icalLinkService';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ICalLinksTableProps {
  icalLinks: ICalLink[];
  properties: Property[];
  onRefetch: () => void;
}

const ICalLinksTable: React.FC<ICalLinksTableProps> = ({ icalLinks, properties, onRefetch }) => {
  const navigate = useNavigate();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<ICalLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group iCal links by property
  const groupedLinks = icalLinks.reduce((acc, link) => {
    if (!acc[link.propertyId]) {
      acc[link.propertyId] = [];
    }
    acc[link.propertyId].push(link);
    return acc;
  }, {} as Record<string, ICalLink[]>);
  
  const getPlatformBadgeVariant = (platform: string) => {
    switch (platform) {
      case 'Airbnb': return 'destructive';
      case 'Booking': return 'booking';
      case 'Vrbo': return 'secondary';
      default: return 'outline';
    }
  };

  const handleSync = async (link: ICalLink) => {
    setSyncingId(link.id);
    try {
      toast.info("Sincronizando calendario", {
        description: "Obteniendo reservas desde el origen..."
      });
      
      const result = await syncICalLink(link);
      
      if (result.success && result.results) {
        toast.success("Calendario sincronizado", {
          description: `Se encontraron ${result.results.total} eventos. ${result.results.added} nuevas reservas añadidas, ${result.results.updated} actualizadas.`
        });
        
        onRefetch();
      } else {
        toast.error("Error al sincronizar", {
          description: result.error || "No se pudieron sincronizar las reservas."
        });
      }
    } catch (error) {
      console.error('Error syncing iCal:', error);
      toast.error("Error de sincronización", {
        description: "Ocurrió un error al sincronizar el calendario."
      });
    } finally {
      setSyncingId(null);
    }
  };
  
  const handleSyncAllForProperty = async (propertyId: string) => {
    const propertyLinks = groupedLinks[propertyId];
    if (!propertyLinks || propertyLinks.length === 0) return;
    
    toast.info("Sincronizando calendarios", {
      description: `Sincronizando ${propertyLinks.length} calendarios para esta propiedad...`
    });
    
    let successCount = 0;
    let failCount = 0;
    
    for (const link of propertyLinks) {
      setSyncingId(link.id);
      try {
        const result = await syncICalLink(link);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error syncing iCal:', error);
        failCount++;
      } finally {
        setSyncingId(null);
      }
    }
    
    if (failCount === 0) {
      toast.success("Sincronización completada", {
        description: `Se sincronizaron correctamente ${successCount} calendarios.`
      });
    } else {
      toast.warning("Sincronización parcial", {
        description: `${successCount} calendarios sincronizados, ${failCount} fallaron.`
      });
    }
    
    onRefetch();
  };
  
  const openDeleteDialog = (link: ICalLink) => {
    setLinkToDelete(link);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteICalLink(linkToDelete.id);
      if (success) {
        toast.success("Enlace iCal eliminado", {
          description: "El enlace iCal ha sido eliminado correctamente."
        });
        onRefetch();
      } else {
        toast.error("Error al eliminar", {
          description: "No se pudo eliminar el enlace iCal. Intenta de nuevo."
        });
      }
    } catch (error) {
      console.error('Error deleting iCal link:', error);
      toast.error("Error al eliminar", {
        description: "Ocurrió un error al eliminar el enlace iCal."
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getPropertyName = (propertyId: string): string => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Propiedad desconocida';
  };

  const getLastSyncedText = (propertyLinks: ICalLink[]): string => {
    // Get the most recent sync date across all links for this property
    const mostRecentSync = propertyLinks
      .map(link => link.lastSynced)
      .filter(Boolean)
      .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];
    
    if (!mostRecentSync) return "Nunca";
    
    return format(mostRecentSync, "dd MMM yyyy, HH:mm", { locale: es });
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Propiedad</TableHead>
            <TableHead>Plataformas</TableHead>
            <TableHead>Última sincronización</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedLinks).map(([propertyId, propertyLinks]) => (
            <TableRow key={propertyId}>
              <TableCell className="font-medium">
                {getPropertyName(propertyId)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {propertyLinks.map((link) => (
                    <Popover key={link.id}>
                      <PopoverTrigger asChild>
                        <Badge 
                          variant={getPlatformBadgeVariant(link.platform)}
                          className="cursor-pointer"
                        >
                          {link.platform}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">{link.platform}</h4>
                          <div className="text-xs text-muted-foreground break-all">
                            <span className="font-semibold">URL:</span> {link.url}
                          </div>
                          <div className="flex justify-between mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(link)}
                              disabled={syncingId === link.id}
                            >
                              <RefreshCw 
                                className={`h-4 w-4 mr-1 ${syncingId === link.id ? "animate-spin" : ""}`} 
                              />
                              Sincronizar
                            </Button>
                            <div className="space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/ical-links/edit/${link.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => openDeleteDialog(link)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </TableCell>
              <TableCell>{getLastSyncedText(propertyLinks)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncAllForProperty(propertyId)}
                    disabled={!!syncingId}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${syncingId ? "animate-spin" : ""}`} />
                    Sincronizar Todo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/properties/${propertyId}`)}
                  >
                    Ver Propiedad
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este enlace iCal?
              {linkToDelete && (
                <span className="block mt-2">
                  <strong>Plataforma:</strong> {linkToDelete.platform}<br />
                  <strong>Propiedad:</strong> {linkToDelete ? getPropertyName(linkToDelete.propertyId) : ''}
                </span>
              )}
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
    </div>
  );
};

export default ICalLinksTable;
