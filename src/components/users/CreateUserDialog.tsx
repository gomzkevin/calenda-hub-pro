import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createUser, getCurrentUser } from '@/services/userService';
import { getProperties } from '@/services/propertyService';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const queryClient = useQueryClient();
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [creationError, setCreationError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });
  
  // Obtener propiedades para asignar al nuevo usuario
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: open
  });
  
  // Obtener el usuario actual para identificarlo como el administrador que crea el usuario
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    enabled: open
  });
  
  const createUserMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      setCreationError(null);
      console.log("Creating user with selected properties:", selectedPropertyIds);
      console.log("Current user (admin) creating:", currentUser);
      
      if (!currentUser || !currentUser.id) {
        throw new Error('No se pudo identificar al usuario administrador. Por favor, inicie sesión nuevamente.');
      }
      
      return createUser(values.email, values.password, values.name, selectedPropertyIds);
    },
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(`Error: ${response.message}`);
        setCreationError(response.message);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
      form.reset();
      setSelectedPropertyIds([]);
      setCreationError(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Error al crear el usuario');
      setCreationError(error.message || 'Ocurrió un error al crear el usuario');
      console.error('Error creating user:', error);
    }
  });
  
  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (properties.length === selectedPropertyIds.length) {
      setSelectedPropertyIds([]);
    } else {
      setSelectedPropertyIds(properties.map(prop => prop.id));
    }
  };
  
  const isLoading = isLoadingCurrentUser || isLoadingProperties || createUserMutation.isPending;
  const allSelected = properties.length > 0 && selectedPropertyIds.length === properties.length;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete los datos para crear un nuevo usuario en el sistema
          </DialogDescription>
        </DialogHeader>
        
        {!currentUser?.role || currentUser.role !== 'admin' ? (
          <div className="flex items-center p-4 text-sm border border-red-200 bg-red-50 text-red-800 rounded-md">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>Solo los administradores pueden crear usuarios.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="block mb-2">Acceso a propiedades</FormLabel>
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox 
                    id="select-all-properties"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <label 
                    htmlFor="select-all-properties"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Seleccionar todas
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border p-2 rounded-md">
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center p-4 col-span-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Cargando propiedades...</span>
                    </div>
                  ) : properties.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay propiedades disponibles</p>
                  ) : (
                    properties.map((property) => (
                      <div key={property.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`property-${property.id}`}
                          checked={selectedPropertyIds.includes(property.id)}
                          onCheckedChange={() => handlePropertyToggle(property.id)}
                        />
                        <label 
                          htmlFor={`property-${property.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {property.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {creationError && (
                <div className="text-destructive text-sm py-2 px-3 bg-destructive/10 rounded-md flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{creationError}</span>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading || !currentUser?.role || currentUser.role !== 'admin'}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : 'Crear Usuario'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
