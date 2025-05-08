
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPropertyAccess, updateUserPropertyAccess, Profile } from '@/services/userService';
import { getProperties } from '@/services/property';
import { refreshPermissions } from '@/services/property/permissions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserPropertiesDialogProps {
  user: Profile | null;
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
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Obtenemos todas las propiedades disponibles
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: open
  });
  
  // Obtenemos los accesos del usuario actual
  const { data: userAccess = [], isLoading: isLoadingAccess, error: accessError } = useQuery({
    queryKey: ['userAccess', user?.id],
    queryFn: () => getUserPropertyAccess(user?.id || ''),
    enabled: !!user && open
  });
  
  // Registrar datos para depuración
  useEffect(() => {
    if (open && user) {
      console.log("UserPropertiesDialog - User:", user);
      console.log("UserPropertiesDialog - Properties:", properties);
      console.log("UserPropertiesDialog - User Access:", userAccess);
      if (accessError) {
        console.error("UserPropertiesDialog - Access Error:", accessError);
      }
    }
  }, [open, user, properties, userAccess, accessError]);
  
  // Sincronizar el estado local con los datos de la API
  useEffect(() => {
    if (userAccess.length > 0 || (!isLoadingAccess && open && user)) {
      console.log("Setting selected properties:", userAccess);
      setSelectedProperties(userAccess);
      setIsInitialized(true);
    }
  }, [userAccess, isLoadingAccess, open, user]);
  
  // Mutación para actualizar los accesos
  const updateAccessMutation = useMutation({
    mutationFn: async () => {
      setUpdateError(null);
      console.log("Updating access for user", user?.id, "with properties:", selectedProperties);
      
      // Update the user's property access
      const result = await updateUserPropertyAccess(user?.id || '', selectedProperties);
      
      if (result.success) {
        // After updating access, refresh permissions to ensure RLS changes take effect immediately
        await refreshPermissions();
        
        // Add a slight delay to ensure the session refresh has propagated
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['userAccess'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      
      toast.success('Accesos actualizados exitosamente');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar los accesos');
      setUpdateError(error.message || 'Ocurrió un error al actualizar los accesos');
      console.error('Error updating access:', error);
    }
  });
  
  const handleSave = () => {
    if (user) {
      updateAccessMutation.mutate();
    }
  };
  
  const handleSelectAll = () => {
    if (properties.length === selectedProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(prop => prop.id));
    }
  };
  
  if (!user) return null;
  
  const isLoading = isLoadingProperties || isLoadingAccess || !isInitialized;
  const allSelected = properties.length > 0 && selectedProperties.length === properties.length;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Propiedades - {user.name}</DialogTitle>
          <DialogDescription>
            Selecciona las propiedades a las que el usuario tendrá acceso
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {accessError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al cargar los accesos: {accessError.message}
              </AlertDescription>
            </Alert>
          )}
          
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
            <>
              <div className="flex items-center space-x-2 mb-4 border-b pb-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Seleccionar todas
                </label>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            </>
          )}
          
          {updateError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {updateError}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave}
            disabled={updateAccessMutation.isPending || isLoading}
          >
            {updateAccessMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPropertiesDialog;
