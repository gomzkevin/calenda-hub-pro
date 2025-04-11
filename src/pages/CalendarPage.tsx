
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
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId);
  
  // Fetch properties from Supabase
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  // Set the first property as default if none is selected and properties are loaded
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      const firstPropertyId = properties[0]?.id || '';
      setSelectedPropertyId(firstPropertyId);
      
      // Update URL with the first property
      const params = new URLSearchParams(location.search);
      params.set('property', firstPropertyId);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [properties, selectedPropertyId, location.pathname, location.search, navigate]);
  
  // Handle property selection change
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    
    // Update URL with the selected property
    const params = new URLSearchParams(location.search);
    params.set('property', propertyId);
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="sm:w-64">
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
          />
        </div>
      </div>
      
      <Tabs defaultValue="monthly">
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="multi">Multi-Property View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Calendar</CardTitle>
              <CardDescription>
                {properties.find(p => p.id === selectedPropertyId)?.name || 'Selected property'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyCalendar 
                propertyId={selectedPropertyId} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="multi">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Property View</CardTitle>
              <CardDescription>
                Operational view showing all properties by day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
