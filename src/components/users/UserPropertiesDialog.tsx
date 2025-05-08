import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Profile, getUserPropertyIds, updateUserPropertyAccess } from '@/services/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { debugPropertyAccess } from '@/services/property/tests';
import { refreshPermissions } from '@/services/property/permissions';

interface UserPropertiesDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserPropertiesDialog: React.FC<UserPropertiesDialogProps> = ({ user, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: open,
  });

  const { data: userProperties, isLoading: isLoadingUserProperties } = useQuery({
    queryKey: ['userProperties', user?.id],
    queryFn: () => user ? getUserPropertyIds(user.id) : [],
    enabled: open && !!user?.id,
  });

  useEffect(() => {
    if (userProperties) {
      setSelectedPropertyIds(userProperties);
    }
  }, [userProperties]);

  const updatePropertyAccessMutation = useMutation({
    mutationFn: (propertyIds: string[]) => {
      if (!user) return Promise.reject('No user selected');
      return updateUserPropertyAccess(user.id, propertyIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userProperties', user?.id] });
      toast.success('Acceso a propiedades actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar el acceso a propiedades: ${error.message || 'Ocurrió un error'}`);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    updatePropertyAccessMutation.mutate(selectedPropertyIds);
  };

  const handleRefreshPermissions = async () => {
    setIsRefreshing(true);
    try {
      if (!user) {
        toast.error('No user selected');
        return;
      }
      const success = await refreshPermissions();
      if (success) {
        toast.success('Permisos actualizados exitosamente');
      } else {
        toast.error('Error al actualizar los permisos');
      }
    } catch (error: any) {
      toast.error(`Error al actualizar los permisos: ${error.message || 'Ocurrió un error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isLoadingProperties || isLoadingUserProperties;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Asignar Propiedades a Usuario</DialogTitle>
        </DialogHeader>
        {user ? (
          <div className="grid gap-4">
            <p>Asignar propiedades al usuario: {user.name} ({user.email})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto border p-2 rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center p-4 col-span-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Cargando propiedades...</span>
                </div>
              ) : properties && properties.length > 0 ? (
                properties.map((property) => (
                  <div key={property.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`property-${property.id}`}
                      checked={selectedPropertyIds.includes(property.id)}
                      onCheckedChange={() => handlePropertyToggle(property.id)}
                    />
                    <label
                      htmlFor={`property-${property.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {property.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No hay propiedades disponibles</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleRefreshPermissions} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar Permisos
                  </>
                )}
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <p>No se ha seleccionado ningún usuario.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserPropertiesDialog;
