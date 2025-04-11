
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ICalLinkCard from '@/components/ical/ICalLinkCard';
import { useQuery } from '@tanstack/react-query';
import { getICalLinks, getPropertyById } from '@/services/supabaseService';
import { toast } from '@/hooks/use-toast';

const ICalLinksPage = () => {
  const navigate = useNavigate();
  
  const { data: icalLinks, isLoading, error } = useQuery({
    queryKey: ['icalLinks'],
    queryFn: getICalLinks
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    toast({
      variant: "destructive",
      title: "Error al cargar enlaces iCal",
      description: "No pudimos cargar los enlaces iCal. Por favor intenta de nuevo."
    });
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">No se pudieron cargar los enlaces iCal</h3>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Enlaces iCal</h1>
        <Button
          onClick={() => navigate('/ical-links/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Añadir Enlace iCal</span>
        </Button>
      </div>
      
      {icalLinks && icalLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {icalLinks.map((icalLink) => (
            <ICalLinkCard 
              key={icalLink.id} 
              icalLink={icalLink} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No hay enlaces iCal</h3>
          <p className="text-gray-500 mb-4">
            Añade enlaces iCal para sincronizar las reservas de tus propiedades.
          </p>
          <Button 
            onClick={() => navigate('/ical-links/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir tu primer enlace iCal</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ICalLinksPage;
