
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    params.set('property', propertyId);
    params.set('view', view);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    updateUrlParams(propertyId, activeView);
  };
  
  const handleViewChange = (view: string) => {
    setActiveView(view);
    updateUrlParams(selectedPropertyId, view);
  };
  
  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden">
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
          <AddReservationButton 
            propertyId={selectedPropertyId} 
            className="w-full sm:w-auto"
          />
        </div>
      </div>
      
      <Tabs value={activeView} onValueChange={handleViewChange} className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList className="mb-2 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="multi">Multi-Property View</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="monthly" className="flex-1 h-full data-[state=inactive]:hidden">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Monthly Calendar</CardTitle>
                <CardDescription>
                  {properties.find(p => p.id === selectedPropertyId)?.name || 'Selected property'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0 sm:p-6">
                <MonthlyCalendar 
                  propertyId={selectedPropertyId} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="multi" className="flex-1 h-full data-[state=inactive]:hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-0">
                <CardTitle>Multi-Property View</CardTitle>
                <CardDescription>
                  Operational view showing all properties by day
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 sm:p-6">
                <MultiCalendar />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
