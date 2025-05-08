
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, MapPin, Building2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { getUserAccessibleProperties } from '@/services/property';
import { getCurrentUser } from '@/services/userService';
import { toast } from 'sonner';
import { Property } from '@/types';
import { refreshPermissions } from '@/services/property/permissions';

const PropertiesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [refreshingPermissions, setRefreshingPermissions] = useState(false);
  
  // Get current user to check if admin
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser
  });
  
  // Forzar refresco de permisos al cargar la página o cambiar de usuario
  useEffect(() => {
    const refreshUserPermissions = async () => {
      setRefreshingPermissions(true);
      console.log("Initial permission refresh on page load");
      await refreshPermissions();
      setRefreshingPermissions(false);
    };
    
    refreshUserPermissions();
  }, [currentUser?.id]);
  
  // Usar la consulta que respeta RLS y asegurarse de refrescar cuando cambie el usuario
  const { data: properties, isLoading, error, isRefetching, refetch } = useQuery({
    queryKey: ['accessible-properties', currentUser?.id],
    queryFn: getUserAccessibleProperties,
    refetchOnWindowFocus: false,
    enabled: !refreshingPermissions
  });
  
  const isAdmin = currentUser?.role === 'admin';
  
  // Función para forzar el refresco de permisos y propiedades
  const handleForceRefresh = async () => {
    setRefreshingPermissions(true);
    toast.info("Refrescando permisos y propiedades...");
    
    try {
      // Forzar refresco de sesión para actualizar RLS
      await refreshPermissions();
      
      // Esperar un momento para que los permisos se apliquen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refrescar datos
      await refetch();
      
      toast.success("Permisos y propiedades actualizados");
    } catch (error) {
      toast.error("Error al refrescar permisos");
      console.error("Error refreshing:", error);
    } finally {
      setRefreshingPermissions(false);
    }
  };
  
  // Filtrar propiedades según la búsqueda
  const filteredProperties = React.useMemo(() => {
    if (!properties) return [];
    
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return properties;
    
    return properties.filter(
      (property) => 
        property.name.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.internalCode.toLowerCase().includes(searchTerm)
    );
  }, [properties, search]);
  
  // Determinar el color del badge según el tipo de propiedad
  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'parent':
        return 'bg-blue-100 text-blue-800';
      case 'child':
        return 'bg-purple-100 text-purple-800';
      case 'Villa':
        return 'bg-amber-100 text-amber-800';
      case 'Apartment':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading || refreshingPermissions) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    toast.error("Error al cargar propiedades", {
      description: "No pudimos cargar las propiedades. Por favor intenta de nuevo."
    });
    
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">No se pudieron cargar las propiedades</h3>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Propiedades</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleForceRefresh}
            disabled={isRefetching || refreshingPermissions}
            className="mr-2"
            title="Refrescar permisos y propiedades"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefetching || refreshingPermissions ? 'animate-spin' : ''}`} />
          </Button>
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Buscar propiedades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
          </div>
          <Button
            onClick={() => navigate('/properties/new')}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Añadir Propiedad</span>
            <span className="sm:hidden">Añadir</span>
          </Button>
        </div>
      </div>
      
      {!isAdmin && properties && properties.length === 0 ? (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso limitado</AlertTitle>
          <AlertDescription>
            No tienes acceso a ninguna propiedad. Contacta a un administrador para que te asigne propiedades.
          </AlertDescription>
        </Alert>
      ) : null}
      
      {isRefetching && (
        <div className="flex items-center justify-center py-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Actualizando propiedades...</span>
        </div>
      )}
      
      {properties && properties.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Habitaciones</TableHead>
                <TableHead className="text-center">Baños</TableHead>
                <TableHead className="text-center">Capacidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {property.imageUrl ? (
                        <div className="w-8 h-8 rounded overflow-hidden mr-2 flex-shrink-0">
                          <img 
                            src={property.imageUrl} 
                            alt={property.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <Building2 className="w-5 h-5 mr-2 text-muted-foreground" />
                      )}
                      <span className="truncate max-w-[200px]">{property.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{property.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{property.internalCode}</TableCell>
                  <TableCell>
                    {property.type && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(property.type)}`}>
                        {property.type}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{property.bedrooms}</TableCell>
                  <TableCell className="text-center">{property.bathrooms}</TableCell>
                  <TableCell className="text-center">{property.capacity}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No hay propiedades</h3>
          <p className="text-gray-500 mb-4">
            {!isAdmin 
              ? "No tienes acceso a ninguna propiedad. Contacta a un administrador."
              : "Todavía no has agregado ninguna propiedad para gestionar."}
          </p>
          {isAdmin && (
            <Button 
              onClick={() => navigate('/properties/new')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Añadir tu primera propiedad</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
