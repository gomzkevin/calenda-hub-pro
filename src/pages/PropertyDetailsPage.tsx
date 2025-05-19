
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getPropertyById } from '@/services/propertyService';
import PropertyDetails from '@/components/properties/PropertyDetails';
import PropertyEditForm from '@/components/properties/PropertyEditForm';

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: property, isLoading: isPropertyLoading, error: propertyError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyById(id || ''),
    enabled: !!id
  });
  
  if (isPropertyLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (propertyError || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Propiedad no encontrada</h1>
        <Button onClick={() => navigate('/properties')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Propiedades
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/properties')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">{property.name}</h1>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <PropertyEditForm 
          property={property} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <PropertyDetails property={property} />
      )}
    </div>
  );
};

export default PropertyDetailsPage;
