
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPropertyAccess, updateUserPropertyAccess } from '@/services/userService';
import { getProperties } from '@/services/propertyService';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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
  
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: open
  });
  
  const { data: userAccess = [], isLoading: isLoadingAccess } = useQuery({
    queryKey: ['userAccess', user?.id],
    queryFn: () => getUserPropertyAccess(user?.id || ''),
    enabled: !!user && open
  });
  
  // Update selected properties when userAccess changes, not on every render
  useEffect(() => {
    if (userAccess && !isLoadingAccess) {
      setSelectedProperties(userAccess);
    }
  }, [userAccess, isLoadingAccess]);
  
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Propiedades - {user.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {property.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave}
            disabled={updateAccessMutation.isPending}
          >
            {updateAccessMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPropertiesDialog;
