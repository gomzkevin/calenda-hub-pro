
import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types';
import { getICalLinksForProperty, getReservationsForProperty } from '@/data/mockData';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const icalLinks = getICalLinksForProperty(property.id);
  const reservations = getReservationsForProperty(property.id);
  
  const activeReservations = reservations.filter(
    res => new Date(res.endDate) >= new Date()
  );
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Building className="w-5 h-5 mr-2 text-blue-500" />
          {property.name}
        </CardTitle>
        <div className="text-sm text-gray-500">{property.internalCode}</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="text-sm">
            <div className="font-medium text-gray-700">Address</div>
            <div>{property.address}</div>
          </div>
          
          <div className="flex justify-between text-sm">
            <div>
              <div className="font-medium text-gray-700">Active Reservations</div>
              <div className="text-blue-600 font-medium">{activeReservations.length}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">iCal Sources</div>
              <div className="text-blue-600 font-medium">{icalLinks.length}</div>
            </div>
          </div>
          
          {property.notes && (
            <div className="text-sm">
              <div className="font-medium text-gray-700">Notes</div>
              <div className="text-gray-600">{property.notes}</div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button asChild variant="outline" size="sm">
          <Link to={`/properties/${property.id}`}>
            <Building className="w-4 h-4 mr-1" />
            Details
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to={`/calendar?property=${property.id}`}>
            <Calendar className="w-4 h-4 mr-1" />
            Calendar
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
