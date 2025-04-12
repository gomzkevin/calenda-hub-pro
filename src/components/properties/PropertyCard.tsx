
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
  
  // Determine the color based on the property bedrooms count
  const getBorderColor = () => {
    switch (property.bedrooms) {
      case 1:
        return "border-l-blue-400";
      case 2:
        return "border-l-green-400";
      case 3:
        return "border-l-purple-400";
      case 4:
        return "border-l-amber-400";
      default:
        return "border-l-gray-400";
    }
  };
  
  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow border-l-4 ${getBorderColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div 
              className="font-semibold text-lg truncate mb-1 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              {property.name}
            </div>
            
            <div className="flex items-center text-muted-foreground text-sm mb-3">
              <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{property.address}</span>
            </div>
          </div>
          <Home className="h-6 w-6 text-muted-foreground/70 flex-shrink-0" />
        </div>
        
        <div className="flex justify-between mt-3">
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
