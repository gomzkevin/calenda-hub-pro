
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const initialView = queryParams.get('view') || 'monthly';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId);
  const [activeView, setActiveView] = useState<string>(initialView);
  
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      const firstPropertyId = properties[0]?.id || '';
      setSelectedPropertyId(firstPropertyId);
      updateUrlParams(firstPropertyId, activeView);
    }
  }, [properties, selectedPropertyId, activeView]);
  
  const updateUrlParams = (propertyId: string, view: string) => {
    const params = new URLSearchParams(location.search);
    if (propertyId) params.set('property', propertyId);
    params.set('view', view);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  const handlePropertyChange = (propertyId: string) => {
    if (!propertyId) return; // Added check to prevent empty property IDs
    setSelectedPropertyId(propertyId);
    updateUrlParams(propertyId, activeView);
  };
  
  const handleViewChange = (view: string) => {
    setActiveView(view);
    updateUrlParams(selectedPropertyId, view);
  };
  
  // Find the selected property name for display
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex flex-col w-full sm:flex-row sm:w-auto items-stretch sm:items-center gap-3">
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
          {selectedPropertyId && (
            <AddReservationButton 
              propertyId={selectedPropertyId} 
              className="w-full sm:w-auto"
            />
          )}
        </div>
      </div>
      
      <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:w-auto">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="multi">Multi-Property View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="w-full h-[calc(100vh-220px)]">
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
        
        <TabsContent value="multi" className="w-full h-[calc(100vh-220px)]">
          <Card className="w-full h-full flex flex-col">
            <CardContent className="p-0 h-full flex-1 flex flex-col overflow-hidden">
              <MultiCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
