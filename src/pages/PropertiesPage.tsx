
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/properties/PropertyCard';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';
import { toast } from '@/hooks/use-toast';

const PropertiesPage = () => {
  const navigate = useNavigate();
  
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    toast({
      variant: "destructive",
      title: "Error al cargar propiedades",
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Propiedades</h1>
        <Button
          onClick={() => navigate('/properties/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Añadir Propiedad</span>
        </Button>
      </div>
      
      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No hay propiedades</h3>
          <p className="text-gray-500 mb-4">
            Todavía no has agregado ninguna propiedad para gestionar.
          </p>
          <Button 
            onClick={() => navigate('/properties/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir tu primera propiedad</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
