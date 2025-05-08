import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import MultiCalendar from '@/components/calendar/MultiCalendar';
import AddReservationButton from '@/components/calendar/AddReservationButton';
import { Property } from '@/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialPropertyId = queryParams.get('property') || '';
  // Keep multi view as default
  const initialView = queryParams.get('view') || 'multi';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId);
  const [activeView, setActiveView] = useState<string>(initialView);
  
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId && activeView === 'monthly') {
      // Only set a default property when in monthly view
      const firstPropertyId = properties[0]?.id || '';
      setSelectedPropertyId(firstPropertyId);
      updateUrlParams(firstPropertyId, activeView);
    } else if (activeView === 'multi' && selectedPropertyId) {
      // When switching to multi view, clear property selection from URL
      updateUrlParams('', 'multi');
    }
  }, [properties, selectedPropertyId, activeView]);
  
  const updateUrlParams = (propertyId: string, view: string) => {
    const params = new URLSearchParams(location.search);
    if (propertyId) {
      params.set('property', propertyId);
    } else {
      params.delete('property');
    }
    params.set('view', view);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  const handlePropertyChange = (propertyId: string) => {
    if (!propertyId) return;
    setSelectedPropertyId(propertyId);
    setActiveView('monthly'); // Switch to monthly view when selecting a property
    updateUrlParams(propertyId, 'monthly');
  };
  
  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'multi') {
      // Clear property selection when switching to multi view
      setSelectedPropertyId('');
      updateUrlParams('', view);
    } else if (view === 'monthly' && !selectedPropertyId && properties.length > 0) {
      // Set default property when switching to monthly view
      const firstPropertyId = properties[0]?.id || '';
      setSelectedPropertyId(firstPropertyId);
      updateUrlParams(firstPropertyId, view);
    } else {
      updateUrlParams(selectedPropertyId, view);
    }
  };
  
  // Find the selected property for display
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  
  return (
    <div className="space-y-6 w-full max-w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-3">
          {/* Only show the Add Reservation button when in monthly view with a selected property */}
          {selectedPropertyId && activeView === 'monthly' && (
            <AddReservationButton 
              propertyId={selectedPropertyId}
            />
          )}
        </div>
      </div>
      
      <Tabs value={activeView} onValueChange={handleViewChange} className="w-full flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-2 sm:w-auto">
          <TabsTrigger value="multi">Multi-Property View</TabsTrigger>
          <TabsTrigger value="monthly">
            {activeView === 'monthly' && selectedProperty 
              ? `${selectedProperty.name}` 
              : 'Monthly View'
            }
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="w-full flex-1 flex flex-col">
          <Card className="w-full h-full flex flex-col">
            <CardContent className="p-0 h-full flex-1 flex flex-col overflow-hidden">
              {selectedPropertyId && (
                <MonthlyCalendar 
                  propertyId={selectedPropertyId} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="multi" className="w-full flex-1 flex flex-col">
          <Card className="w-full h-full flex flex-col">
            <CardContent className="p-0 h-full flex-1 flex flex-col overflow-hidden">
              <MultiCalendar onPropertySelect={handlePropertyChange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
