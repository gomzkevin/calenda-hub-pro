
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPropertyAccess, updateUserPropertyAccess } from '@/services/userService';
import { getProperties } from '@/services/propertyService';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface UserPropertiesDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserPropertiesDialog: React.FC<UserPropertiesDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Obtenemos todas las propiedades disponibles
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: open
  });
  
  // Obtenemos los accesos del usuario actual
  const { data: userAccess = [], isLoading: isLoadingAccess } = useQuery({
    queryKey: ['userAccess', user?.id],
    queryFn: () => getUserPropertyAccess(user?.id || ''),
    enabled: !!user && open
  });
  
  // Sincronizar el estado local con los datos de la API
  useEffect(() => {
    if (userAccess.length > 0 || (!isLoadingAccess && open && user)) {
      setSelectedProperties(userAccess);
      setIsInitialized(true);
    }
  }, [userAccess, isLoadingAccess, open, user]);
  
  // Mutación para actualizar los accesos
  const updateAccessMutation = useMutation({
    mutationFn: () => updateUserPropertyAccess(user?.id || '', selectedProperties),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAccess'] });
      toast.success('Accesos actualizados exitosamente');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Error al actualizar los accesos');
      console.error('Error updating access:', error);
    }
  });
  
  const handleSave = () => {
    if (user) {
      updateAccessMutation.mutate();
    }
  };
  
  if (!user) return null;
  
  const isLoading = isLoadingProperties || isLoadingAccess || !isInitialized;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Propiedades - {user.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando propiedades...</span>
            </div>
          ) : properties.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay propiedades disponibles
            </p>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={property.id}
                    checked={selectedProperties.includes(property.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProperties([...selectedProperties, property.id]);
                      } else {
                        setSelectedProperties(
                          selectedProperties.filter((id) => id !== property.id)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={property.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {property.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave}
            disabled={updateAccessMutation.isPending || isLoading}
          >
            {updateAccessMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPropertiesDialog;
