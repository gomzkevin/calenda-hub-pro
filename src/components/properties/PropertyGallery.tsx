
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PropertyGalleryProps {
  propertyId: string;
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ propertyId }) => {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Galería de Imágenes</CardTitle>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Imagen
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            No hay imágenes disponibles para esta propiedad.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Añade imágenes para mostrar la propiedad a tus huéspedes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyGallery;
