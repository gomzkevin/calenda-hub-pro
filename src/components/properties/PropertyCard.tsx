
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Bath, Users, MapPin, Home } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();
  
  // Determine the gradient based on the property bedrooms count
  const getGradient = () => {
    switch (property.bedrooms) {
      case 1:
        return "bg-gradient-to-r from-blue-50 to-blue-100";
      case 2:
        return "bg-gradient-to-r from-green-50 to-green-100";
      case 3:
        return "bg-gradient-to-r from-purple-50 to-purple-100";
      case 4:
        return "bg-gradient-to-r from-amber-50 to-amber-100";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100";
    }
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className={`aspect-video cursor-pointer flex items-center justify-center ${getGradient()}`}
        onClick={() => navigate(`/properties/${property.id}`)}
      >
        <div className="text-center">
          <Home className="h-12 w-12 mx-auto mb-2 text-primary/70" />
          <span className="font-medium text-lg text-gray-700">{property.name}</span>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div 
          className="font-semibold text-lg truncate mb-1 cursor-pointer" 
          onClick={() => navigate(`/properties/${property.id}`)}
        >
          {property.name}
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          <span className="truncate">{property.address}</span>
        </div>
        
        <div className="flex justify-between">
          <div className="flex items-center text-sm">
            <BedDouble className="w-4 h-4 mr-1" />
            <span>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Bath className="w-4 h-4 mr-1" />
            <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-1" />
            <span>{property.capacity} guests</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/properties/${property.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
