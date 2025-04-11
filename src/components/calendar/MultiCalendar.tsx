import React, { useState, useEffect } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addDays, isAfter, isBefore, min } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';
import { ScrollArea } from '@/components/ui/scroll-area';

// Number of days to show at a time
const DAYS_TO_SHOW = 15;

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [visibleStartDate, setVisibleStartDate] = useState<Date>(startOfMonth(new Date()));
  
  // Reset visible range when month changes
  useEffect(() => {
    setVisibleStartDate(startOfMonth(currentMonth));
  }, [currentMonth]);
  
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
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  const nextRange = () => {
    const monthEnd = endOfMonth(currentMonth);
    const proposedStart = addDays(visibleStartDate, DAYS_TO_SHOW);
    
    // Check if we would go past the end of the month
    if (isAfter(addDays(proposedStart, DAYS_TO_SHOW - 1), monthEnd)) {
      // If there are still days left to show in the month, move to show the last DAYS_TO_SHOW days
      if (isAfter(monthEnd, visibleStartDate)) {
        // Calculate the start date that would show the last DAYS_TO_SHOW days of the month (or fewer if the month has fewer days)
        const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: monthEnd }).length;
        const lastRangeStart = addDays(startOfMonth(currentMonth), Math.max(0, daysInMonth - DAYS_TO_SHOW));
        setVisibleStartDate(lastRangeStart);
      }
      // Otherwise, we're already showing the last days, so don't change
    } else {
      // Safe to move forward DAYS_TO_SHOW days
      setVisibleStartDate(proposedStart);
    }
  };
  
  const prevRange = () => {
    const monthStart = startOfMonth(currentMonth);
    const proposedStart = addDays(visibleStartDate, -DAYS_TO_SHOW);
    
    // Check if we would go before the start of the month
    if (isBefore(proposedStart, monthStart)) {
      // Just go to the start of the month
      setVisibleStartDate(monthStart);
    } else {
      // Safe to move back DAYS_TO_SHOW days
      setVisibleStartDate(proposedStart);
    }
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Calculate the end date for our visible range
  const visibleEndDate = min([
    addDays(visibleStartDate, DAYS_TO_SHOW - 1),
    monthEnd
  ]);
  
  // Create array of visible days
  const visibleDays = eachDayOfInterval({ 
    start: visibleStartDate, 
    end: visibleEndDate 
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

  // Check if we're at the start of the month (disable prev range button)
  const isAtMonthStart = isSameDay(visibleStartDate, monthStart);
  
  // Check if we're at the end of the month (disable next range button)
  const isAtMonthEnd = isSameDay(addDays(visibleStartDate, DAYS_TO_SHOW - 1), monthEnd) || 
                       isAfter(addDays(visibleStartDate, DAYS_TO_SHOW - 1), monthEnd);

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
      {/* Fixed header with month title and navigation buttons */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex space-x-2">
            {/* Month navigation */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={prevMonth}
              title="Previous Month"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            {/* Range navigation */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={prevRange}
              disabled={isAtMonthStart}
              title="Previous Range"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={nextRange}
              disabled={isAtMonthEnd}
              title="Next Range"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Month navigation */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={nextMonth}
              title="Next Month"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Date range indicator */}
        <div className="text-sm text-center pb-2 text-muted-foreground">
          {format(visibleStartDate, 'MMM d')} - {format(visibleEndDate, 'MMM d, yyyy')}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100%-85px)] w-full">
          <div className="relative min-w-max">
            {/* Using grid template with columns for property name + visible days */}
            <div className={`grid grid-cols-[160px_repeat(${visibleDays.length},minmax(45px,1fr))]`}>
              {/* Header row with dates */}
              <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
                Properties
              </div>
              
              {/* Day header cells */}
              {visibleDays.map((day, index) => (
                <div 
                  key={index}
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
                  
                  {/* Calendar cells for each property */}
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
