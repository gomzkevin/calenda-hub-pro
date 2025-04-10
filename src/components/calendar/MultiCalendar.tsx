
import React, { useState } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReservationsForMonth, getPlatformColorClass, sampleProperties } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const reservations = getReservationsForMonth(
    currentMonth.getMonth() + 1, 
    currentMonth.getFullYear()
  );
  const properties = sampleProperties;
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get reservations for a specific day and property
  const getReservationsForDayAndProperty = (day: Date, propertyId: string): Reservation[] => {
    return reservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      return (
        reservation.propertyId === propertyId &&
        ((day >= reservationStart && day <= reservationEnd) ||
        (format(day, 'yyyy-MM-dd') === format(reservationStart, 'yyyy-MM-dd')) ||
        (format(day, 'yyyy-MM-dd') === format(reservationEnd, 'yyyy-MM-dd')))
      );
    });
  };
  
  // Check if a day has a reservation for a property
  const getDayStatus = (day: Date, propertyId: string): { hasReservation: boolean, platform?: string } => {
    const dayReservations = getReservationsForDayAndProperty(day, propertyId);
    
    if (dayReservations.length > 0) {
      return { 
        hasReservation: true, 
        platform: dayReservations[0].platform 
      };
    }
    
    return { hasReservation: false };
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-auto">
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
        <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${monthDays.length}, minmax(40px, 1fr))` }}>
          {/* Header row with dates */}
          <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
            Properties
          </div>
          
          {monthDays.map((day, index) => (
            <div 
              key={index}
              className="sticky top-0 z-10 bg-white border-b h-10 flex flex-col items-center justify-center font-medium text-xs"
            >
              <span>{format(day, 'EEE')}</span>
              <span>{format(day, 'd')}</span>
            </div>
          ))}
          
          {/* Property rows */}
          {properties.map((property: Property) => (
            <React.Fragment key={property.id}>
              {/* Property name (first column) */}
              <div className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate">
                {property.name}
              </div>
              
              {/* Calendar cells */}
              {monthDays.map((day, dayIndex) => {
                const { hasReservation, platform } = getDayStatus(day, property.id);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={dayIndex}
                    className={`border ${isToday ? 'bg-blue-50' : ''} h-10 relative`}
                  >
                    {hasReservation && platform && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`absolute inset-0.5 rounded ${getPlatformColorClass(platform as any)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p><strong>{property.name}</strong></p>
                              <p><strong>Platform:</strong> {platform}</p>
                              <p><strong>Date:</strong> {format(day, 'MMM d, yyyy')}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiCalendar;
