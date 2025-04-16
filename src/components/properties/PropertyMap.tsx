
import React from 'react';
import { Card } from '@/components/ui/card';
import { Property } from '@/types';

interface PropertyMapProps {
  property: Property;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ property }) => {
  return (
    <div className="w-full h-60 bg-gray-100 rounded-md flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-2">Mapa de ubicación</p>
        <p className="font-medium">{property.address}</p>
      </div>
    </div>
  );
};

export default PropertyMap;
