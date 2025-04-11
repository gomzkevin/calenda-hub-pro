
import React, { useState } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';
import { ScrollArea } from '@/components/ui/scroll-area';

// Maximum number of days to display at once
const DAYS_TO_SHOW = 15;

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // Start with the first day of the month
  const [currentStartDate, setCurrentStartDate] = useState<Date>(startOfMonth(new Date()));
  
  // Fetch reservations
  const { data: allReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', 'multi', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getReservationsForMonth(
      currentMonth.getMonth() + 1, 
      currentMonth.getFullYear()
    )
  });
  
  // Only filter out reservations with specifically "Blocked" in notes that are not relationship-based blocks
  const reservations = allReservations.filter(res => {
    // Show if not blocked or if it's a relationship-based block
    return res.notes !== 'Blocked' || res.sourceReservationId || res.isBlocking;
  });
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  // Navigation functions
  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setCurrentStartDate(startOfMonth(newMonth));
  };
  
  const prevMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    setCurrentMonth(newMonth);
    setCurrentStartDate(startOfMonth(newMonth));
  };
  
  const nextRange = () => {
    setCurrentStartDate(prev => {
      const next = addDays(prev, DAYS_TO_SHOW);
      // Don't go beyond the current month
      const monthEnd = endOfMonth(currentMonth);
      return next > monthEnd ? prev : next;
    });
  };
  
  const prevRange = () => {
    setCurrentStartDate(prev => {
      const next = addDays(prev, -DAYS_TO_SHOW);
      // Don't go before the start of the month
      const monthStart = startOfMonth(currentMonth);
      return next < monthStart ? monthStart : next;
    });
  };
  
  // Calculate visible days range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Calculate the end date for the visible range
  const visibleEndDate = addDays(currentStartDate, DAYS_TO_SHOW - 1);
  // Make sure we don't go beyond the end of the month
  const actualEndDate = visibleEndDate > monthEnd ? monthEnd : visibleEndDate;
  
  // Create the array of visible days
  const visibleDays = eachDayOfInterval({ 
    start: currentStartDate, 
    end: actualEndDate 
  });
  
  // Get reservations for a specific property
  const getReservationsForProperty = (propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  };

  const isLoading = isLoadingReservations || isLoadingProperties;

  // Helper to normalize date to noon UTC to avoid timezone issues
  const normalizeDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCHours(12, 0, 0, 0);
    return newDate;
  };

  // Get reservation style based on type
  const getReservationStyle = (reservation: Reservation) => {
    // If it's a block from a related property
    if (reservation.notes === 'Blocked' && reservation.sourceReservationId) {
      return 'bg-gray-400 opacity-70 border border-dashed border-white';
    }
    
    // Normal reservation
    return getPlatformColorClass(reservation.platform);
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
      {/* Fixed header with month title and navigation buttons */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between p-4">
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
        
        {/* Add day range navigation controls */}
        <div className="px-4 pb-2 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {format(currentStartDate, 'MMM d')} - {format(actualEndDate, 'MMM d')}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevRange}
              disabled={isSameDay(currentStartDate, monthStart)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextRange}
              disabled={isSameDay(actualEndDate, monthEnd)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100%-120px)] w-full">
          <div className="relative min-w-max">
            {/* Using grid template with fixed 15 columns for days */}
            <div className={`grid grid-cols-[160px_repeat(${visibleDays.length},minmax(45px,1fr))]`}>
              {/* Header row with property label */}
              <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
                Properties
              </div>
              
              {/* Header row with dates */}
              {visibleDays.map((day, index) => (
                <div 
                  key={`day-header-${index}`}
                  className={`sticky top-0 z-10 bg-white border-b h-10 flex flex-col items-center justify-center font-medium text-xs ${
                    isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <span>{format(day, 'EEE')}</span>
                  <span>{format(day, 'd')}</span>
                </div>
              ))}
              
              {/* Property rows */}
              {properties.map((property: Property) => (
                <React.Fragment key={property.id}>
                  {/* Property name (first column) */}
                  <div className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate h-16">
                    {property.name}
                  </div>
                  
                  {/* Calendar cells for each visible day */}
                  {visibleDays.map((day, dayIndex) => {
                    const isToday = isSameDay(day, new Date());
                    
                    // Get reservations that include this day
                    const dayReservations = getReservationsForProperty(property.id).filter(res => {
                      const normalizedStart = normalizeDate(res.startDate);
                      const normalizedEnd = normalizeDate(res.endDate);
                      const normalizedDay = normalizeDate(day);
                      
                      return isWithinInterval(normalizedDay, {
                        start: normalizedStart,
                        end: normalizedEnd,
                      });
                    });
                    
                    return (
                      <div
                        key={`day-${property.id}-${dayIndex}`}
                        className={`border relative min-h-[4rem] h-16 ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        {dayReservations.map((res, resIndex) => {
                          // Determine if this is start/end of reservation for styling
                          const isStartDay = isSameDay(res.startDate, day);
                          const isEndDay = isSameDay(res.endDate, day);
                          
                          // Calculate position (stacked if multiple)
                          const top = resIndex * 24 + 4; 
                          
                          // Style based on platform and position
                          const style = getReservationStyle(res);
                          const borderRadius = isStartDay && isEndDay 
                            ? 'rounded-full' 
                            : isStartDay 
                              ? 'rounded-l-full' 
                              : isEndDay 
                                ? 'rounded-r-full'
                                : '';
                          
                          return (
                            <TooltipProvider key={`res-${res.id}-${dayIndex}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`absolute h-5 ${style} ${borderRadius} flex items-center px-1 text-xs text-white font-medium transition-all hover:brightness-90 hover:shadow-md overflow-hidden`}
                                    style={{
                                      top: `${top}px`,
                                      left: isStartDay ? '4px' : '0px',
                                      right: isEndDay ? '4px' : '0px',
                                      zIndex: 5
                                    }}
                                  >
                                    {isStartDay && res.platform}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p><strong>{property.name}</strong></p>
                                    <p><strong>Platform:</strong> {res.platform}</p>
                                    <p><strong>Check-in:</strong> {format(res.startDate, 'MMM d, yyyy')}</p>
                                    <p><strong>Check-out:</strong> {format(res.endDate, 'MMM d, yyyy')}</p>
                                    {res.notes && res.notes !== 'Blocked' && (
                                      <p><strong>Notes:</strong> {res.notes}</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default MultiCalendar;
