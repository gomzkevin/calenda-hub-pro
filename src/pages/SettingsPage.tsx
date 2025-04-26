
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser, updateUserProfile, updateUserPassword } from '@/services/userService';
import { toast } from 'sonner';
import { User } from '@/types';

const SettingsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (authUser) {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          setFormData(prev => ({
            ...prev,
            name: userData.name,
            email: userData.email,
          }));
        }
      }
    };
    fetchUser();
  }, [authUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile(user.id, {
        name: formData.name,
        email: formData.email,
      });
      setUser(updatedUser);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(formData.newPassword);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      toast.success('Contraseña actualizada exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>
      
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Cuenta</TabsTrigger>
          <TabsTrigger value="password">Contraseña</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Información de la cuenta</CardTitle>
              <CardDescription>
                Administra tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
