
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
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

  const getPropertyName = (propertyId: string): string => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Propiedad desconocida';
  };
  
  const getPlatformBadgeVariant = (platform: string) => {
    switch (platform) {
      case 'Airbnb': return 'destructive';
      case 'Booking': return 'default';
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

  const getLastSyncedText = (lastSynced?: Date) => {
    if (!lastSynced) return "Nunca";
    
    return formatDistanceToNow(lastSynced, { 
      addSuffix: true,
      locale: es
    });
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plataforma</TableHead>
            <TableHead>Propiedad</TableHead>
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
              <TableCell>{getPropertyName(link.propertyId)}</TableCell>
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
                    onClick={() => handleSync(link)}
                    disabled={syncingId === link.id}
                  >
                    <RefreshCw 
                      className={`h-4 w-4 ${syncingId === link.id ? "animate-spin" : ""}`} 
                    />
                  </Button>
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
