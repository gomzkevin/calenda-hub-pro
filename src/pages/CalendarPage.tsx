
import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import MultiCalendar from '@/components/calendar/MultiCalendar';
import AddReservationButton from '@/components/calendar/AddReservationButton';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract query parameters only once on component mount
  const initialQueryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      propertyId: params.get('property') || '',
      view: params.get('view') || 'multi' // Default view is multi
    };
  }, []);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialQueryParams.propertyId);
  const [activeView, setActiveView] = useState<string>(initialQueryParams.view);
  
  // Optimize property data fetching with staleTime to reduce API calls
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
    refetchOnWindowFocus: false // Prevent refetch on window focus
  });
  
  // Find the selected property name for display - memoized to prevent recalculations
  const selectedProperty = useMemo(() => 
    properties.find(p => p.id === selectedPropertyId),
    [selectedPropertyId, properties]
  );
  
  // Update URL parameters efficiently
  const updateUrlParams = (propertyId: string, view: string) => {
    const params = new URLSearchParams();
    
    if (propertyId) {
      params.set('property', propertyId);
    }
    
    params.set('view', view);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  // Handle view changes
  const handleViewChange = (view: string) => {
    setActiveView(view);
    
    if (view === 'multi') {
      // Clear property selection when switching to multi view
      setSelectedPropertyId('');
      updateUrlParams('', view);
    } else if (view === 'monthly' && selectedPropertyId) {
      updateUrlParams(selectedPropertyId, view);
    }
  };
  
  // Handle property selection
  const handlePropertySelect = (propertyId: string) => {
    if (!propertyId) return;
    setSelectedPropertyId(propertyId);
    setActiveView('monthly'); // Switch to monthly view when selecting a property
    updateUrlParams(propertyId, 'monthly');
  };
  
  return (
    <div className="space-y-6 w-full max-w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">
          {activeView === 'monthly' && selectedProperty 
            ? `Calendar - ${selectedProperty.name}` 
            : 'Calendar'}
        </h1>
        <div className="flex items-center gap-3">
          {activeView === 'monthly' && selectedPropertyId && (
            <AddReservationButton 
              propertyId={selectedPropertyId} 
              className="w-full sm:w-auto"
            />
          )}
        </div>
      </div>
      
      <Tabs value={activeView} onValueChange={handleViewChange} className="w-full flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-2 sm:w-auto">
          <TabsTrigger value="multi">Multi-Property View</TabsTrigger>
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
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
              <MultiCalendar onPropertySelect={handlePropertySelect} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
