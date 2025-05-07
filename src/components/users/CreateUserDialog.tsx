
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createUser, getCurrentUser } from '@/services/userService';
import { getProperties } from '@/services/propertyService';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });
  
  // Obtener propiedades para asignar al nuevo usuario
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: open
  });
  
  const createUserMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => 
      createUser(values.email, values.password, values.name, selectedPropertyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
      form.reset();
      setSelectedPropertyIds([]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Error al crear el usuario');
      console.error('Error creating user:', error);
    }
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createUserMutation.mutate(values);
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border p-2 rounded-md">
                {properties.length === 0 ? (
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
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
