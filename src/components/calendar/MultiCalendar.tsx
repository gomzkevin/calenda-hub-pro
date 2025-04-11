
import React, { useState } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Fetch reservations
  const { data: allReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', 'multi', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getReservationsForMonth(
      currentMonth.getMonth() + 1, 
      currentMonth.getFullYear()
    )
  });
  
  // Filter out reservations with "Blocked" in notes
  const reservations = allReservations.filter(res => res.notes !== 'Blocked');
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get reservations for a specific property
  const getReservationsForProperty = (propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  };

  const isLoading = isLoadingReservations || isLoadingProperties;

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
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
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
            {properties.map((property: Property) => {
              const propertyReservations = getReservationsForProperty(property.id);
              
              return (
                <React.Fragment key={property.id}>
                  {/* Property name (first column) */}
                  <div className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate">
                    {property.name}
                  </div>
                  
                  {/* Calendar cells */}
                  {monthDays.map((day, dayIndex) => {
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`border ${isToday ? 'bg-blue-50' : ''} h-12 relative`}
                      />
                    );
                  })}

                  {/* Reservation bars */}
                  {propertyReservations.map((reservation, resIndex) => {
                    const startDate = new Date(reservation.startDate);
                    const endDate = new Date(reservation.endDate);
                    
                    // Check if reservation overlaps with current month view
                    if (endDate < monthStart || startDate > monthEnd) {
                      return null;
                    }
                    
                    // Calculate start and end positions
                    const visibleStartDate = startDate < monthStart ? monthStart : startDate;
                    const visibleEndDate = endDate > monthEnd ? monthEnd : endDate;
                    
                    // Find day index for start and end in the month days array
                    const startDayIndex = monthDays.findIndex(d => isSameDay(d, visibleStartDate));
                    let endDayIndex = monthDays.findIndex(d => isSameDay(d, visibleEndDate));
                    if (endDayIndex === -1) {
                      endDayIndex = monthDays.length - 1;
                    }
                    
                    // Calculate grid column positions (0.5 represents middle of the cell)
                    const startPosition = startDayIndex;
                    const endPosition = endDayIndex + 1; // +1 because endDayIndex is inclusive
                    
                    // Calculate width and left position as percentage
                    const left = `calc(200px + (${startPosition + 0.5} * 100% / ${monthDays.length}))`;
                    const width = `calc(${(endPosition - startPosition - 0.5)} * 100% / ${monthDays.length})`;
                    
                    return (
                      <TooltipProvider key={`reservation-${property.id}-${reservation.id}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} rounded-full flex items-center pl-2 text-white font-medium text-sm z-10 transition-all hover:brightness-90 hover:shadow-md`}
                              style={{
                                top: `${56 + (properties.indexOf(property) * 48)}px`,
                                left: left,
                                width: width,
                                minWidth: '40px'
                              }}
                            >
                              {reservation.platform}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p><strong>{property.name}</strong></p>
                              <p><strong>Platform:</strong> {reservation.platform}</p>
                              <p><strong>Check-in:</strong> {format(startDate, 'MMM d')}</p>
                              <p><strong>Check-out:</strong> {format(endDate, 'MMM d, yyyy')}</p>
                              {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
