
import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserStatus, getCurrentUser, getUserPropertyAccess } from '@/services/userService';
import { getProperties } from '@/services/propertyService';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import UserPropertiesDialog from '@/components/users/UserPropertiesDialog';
import { toast } from 'sonner';
import { User } from '@/types';

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  
  // Obtener el usuario actual para verificar permisos
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser
  });
  
  // Obtener todas las propiedades
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: !isLoadingCurrentUser && !!currentUser && currentUser.role === 'admin'
  });
  
  // Obtener todos los usuarios
  const { data: users = [], isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: !isLoadingCurrentUser
  });
  
  useEffect(() => {
    // Depuración
    console.log("Current user:", currentUser);
    console.log("Users fetched:", users);
    console.log("Properties count:", properties.length);
    if (usersError) {
      console.error("Error fetching users:", usersError);
    }
  }, [currentUser, users, properties, usersError]);
  
  const isAdmin = currentUser?.role === 'admin';
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) => 
      updateUserStatus(userId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar el estado del usuario');
      console.error('Error updating user status:', error);
    }
  });
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );
  
  const isLoading = isLoadingCurrentUser || isLoadingUsers;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="ml-2 text-xl">Cargando usuarios...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {search ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No se encontraron usuarios'}
              {usersError && (
                <div className="text-red-500 mt-2">
                  Error al cargar usuarios. Por favor, intente nuevamente.
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={() => refetchUsers()}
                  >
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' ? 'Admin' : 'Usuario'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.active ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {isAdmin && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Building2 className="w-4 h-4 mr-1" />
                                Propiedades
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  updateStatusMutation.mutate({
                                    userId: user.id,
                                    active: !user.active
                                  });
                                }}
                                className={user.active ? "text-red-500" : "text-green-500"}
                                disabled={user.id === currentUser?.id}
                              >
                                {user.active ? 'Desactivar' : 'Activar'}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <CreateUserDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />

          <UserPropertiesDialog
            user={selectedUser}
            open={selectedUser !== null}
            onOpenChange={(open) => !open && setSelectedUser(null)}
          />
        </>
      )}
    </div>
  );
};

export default UsersPage;
