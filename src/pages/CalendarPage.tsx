
import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  // Set 'multi' as the default view
  const initialView = queryParams.get('view') || 'multi';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId);
  const [activeView, setActiveView] = useState<string>(initialView);
  
  // Optimize property data fetching with improved caching
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false // Don't refetch on window focus
  });
  
  // Use useEffect for property selection when Monthly view is active but no property selected
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId && activeView === 'monthly') {
      const firstPropertyId = properties[0]?.id || '';
      setSelectedPropertyId(firstPropertyId);
      updateUrlParams(firstPropertyId, activeView);
    }
  }, [properties, selectedPropertyId, activeView]);
  
  // Memoize the URL params update function to prevent unnecessary recreations
  const updateUrlParams = useMemo(() => {
    return (propertyId: string, view: string) => {
      const params = new URLSearchParams(location.search);
      if (propertyId) params.set('property', propertyId);
      params.set('view', view);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };
  }, [location.search, location.pathname, navigate]);
  
  const handlePropertyChange = (propertyId: string) => {
    if (!propertyId) return;
    setSelectedPropertyId(propertyId);
    updateUrlParams(propertyId, activeView);
  };
  
  const handleViewChange = (view: string) => {
    setActiveView(view);
    updateUrlParams(selectedPropertyId, view);
  };

  const handlePropertyClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setActiveView('monthly');
    updateUrlParams(propertyId, 'monthly');
  };
  
  // Memoize the selected property to prevent unnecessary lookups
  const selectedProperty = useMemo(() => 
    properties.find(p => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  );
  
  return (
    <div className="space-y-6 w-full max-w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex flex-col w-full sm:flex-row sm:w-auto items-stretch sm:items-center gap-3">
          {activeView === 'monthly' && (
            <div className="w-full sm:w-64">
              {isLoading ? (
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <Select
                  value={selectedPropertyId}
                  onValueChange={handlePropertyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property: Property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          {selectedPropertyId && activeView === 'monthly' && (
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
              <MultiCalendar onPropertyClick={handlePropertyClick} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
