
import React, { useEffect, useState } from 'react';
import { ExternalLink, Trash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ICalLink, Property } from '@/types';
import { getPropertyById } from '@/services/propertyService';
import { toast } from '@/hooks/use-toast';

interface ICalLinkCardProps {
  icalLink: ICalLink;
}

const ICalLinkCard: React.FC<ICalLinkCardProps> = ({ icalLink }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const propertyData = await getPropertyById(icalLink.propertyId);
        setProperty(propertyData);
      } catch (error) {
        console.error('Error fetching property:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar propiedad",
          description: "No pudimos cargar los detalles de la propiedad."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperty();
  }, [icalLink.propertyId]);
  
  const refreshICalLink = () => {
    // This would call an API to refresh the iCal data
    toast({
      title: "Actualizando datos iCal",
      description: "Los datos se están actualizando..."
    });
  };
  
  if (isLoading) {
    return (
      <Card className="opacity-70">
        <CardHeader className="pb-2">
          <div className="animate-pulse h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="animate-pulse h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="animate-pulse h-3 bg-gray-200 rounded w-1/3"></div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-24"></div>
          <div className="flex space-x-2">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-8"></div>
            <div className="animate-pulse h-8 bg-gray-200 rounded w-8"></div>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 bg-platform-${icalLink.platform.toLowerCase()}`} />
          {icalLink.platform}
        </CardTitle>
        <div className="text-sm font-medium">{property?.name || 'Propiedad desconocida'}</div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm truncate text-gray-500" title={icalLink.url}>
          {icalLink.url}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Añadido el {new Date(icalLink.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(icalLink.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Abrir URL
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={refreshICalLink}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ICalLinkCard;
