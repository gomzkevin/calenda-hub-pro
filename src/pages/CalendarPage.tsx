
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import MultiCalendar from '@/components/calendar/MultiCalendar';
import AddReservationButton from '@/components/calendar/AddReservationButton';
import { Property } from '@/types';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPropertyId = queryParams.get('property') || 'all';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId);
  
  // Fetch properties from Supabase
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
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
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
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
            propertyId={selectedPropertyId !== 'all' ? selectedPropertyId : undefined} 
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
                {selectedPropertyId === 'all' 
                  ? 'Showing all properties' 
                  : `Showing ${properties.find(p => p.id === selectedPropertyId)?.name || 'selected property'}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyCalendar 
                propertyId={selectedPropertyId === 'all' ? undefined : selectedPropertyId} 
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
