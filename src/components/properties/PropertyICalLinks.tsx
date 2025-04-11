
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ICalLinkCard from '@/components/ical/ICalLinkCard';
import { getICalLinksForProperty } from '@/services/supabaseService';

interface PropertyICalLinksProps {
  propertyId: string;
}

const PropertyICalLinks: React.FC<PropertyICalLinksProps> = ({ propertyId }) => {
  const navigate = useNavigate();
  
  // Get iCal links for this property
  const { data: icalLinks, isLoading: isIcalLoading } = useQuery({
    queryKey: ['propertyICalLinks', propertyId],
    queryFn: () => getICalLinksForProperty(propertyId),
    enabled: !!propertyId
  });
  
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Enlaces de Calendario
        </CardTitle>
        <Button size="sm" onClick={() => navigate(`/properties/${propertyId}/ical-links/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir Calendario
        </Button>
      </CardHeader>
      <CardContent>
        {isIcalLoading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : icalLinks && icalLinks.length > 0 ? (
          <div className="space-y-4">
            {icalLinks.map((icalLink) => (
              <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No hay Enlaces de Calendario</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Añade enlaces de calendario desde plataformas como Airbnb, Booking.com o VRBO
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyICalLinks;
