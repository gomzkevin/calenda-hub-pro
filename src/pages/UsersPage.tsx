
import React, { useState } from 'react';
import { Plus, Check, X, Loader2, RefreshCw, Building2 } from 'lucide-react';
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
import { getUsers, updateUserStatus, getCurrentUser } from '@/services/userService';
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
  
  // Obtener todas las propiedades si el usuario es admin
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    enabled: !isLoadingCurrentUser && !!currentUser && currentUser.role === 'admin'
  });
  
  // Obtener todos los usuarios con staleTime muy bajo para forzar recargar datos frescos
  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    error: usersError, 
    refetch: refetchUsers,
    isRefetching
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    retry: 1,
    enabled: !isLoadingCurrentUser && !!currentUser,
    staleTime: 5000  // Considerar datos frescos por 5 segundos
  });
  
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
  
  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );
  
  const isLoading = isLoadingCurrentUser || isLoadingUsers;
  const isRefreshing = isRefetching;

  // Manejar actualización de la lista de usuarios
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    refetchUsers();
    toast.info('Actualizando lista de usuarios...');
  };
  
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
            <>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Actualizar
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Usuario
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              Gestión de Usuarios 
              <Badge variant="outline" className="ml-2">
                {users.length} usuarios
              </Badge>
            </div>
            {isAdmin && currentUser?.operatorId && (
              <Badge variant="secondary" className="text-xs">
                Operador: {currentUser.operatorId}
              </Badge>
            )}
          </CardTitle>
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
                  Error al cargar usuarios: {usersError instanceof Error ? usersError.message : "Ocurrió un error desconocido"}
                </div>
              )}
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>OperadorID</TableHead>
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
                      <TableCell>{user.operatorId}</TableCell>
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
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                // Refrescar la lista de usuarios cuando se cierra el diálogo
                queryClient.invalidateQueries({ queryKey: ['users'] });
              }
            }}
          />

          <UserPropertiesDialog
            user={selectedUser}
            open={selectedUser !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedUser(null);
                // Refrescar la lista de usuarios cuando se cierra el diálogo
                queryClient.invalidateQueries({ queryKey: ['users'] });
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default UsersPage;
