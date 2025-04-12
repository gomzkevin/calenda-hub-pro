
import React, { useState, useMemo } from 'react';
import { addDays, format, isSameDay, isWithinInterval, addMonths, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';
import { ScrollArea } from '@/components/ui/scroll-area';

// Constant for number of days to show
const DAYS_TO_SHOW = 15;

const MultiCalendar: React.FC = () => {
  // Instead of tracking a month, we track a start date
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  // Calculate end date based on start date
  const endDate = addDays(startDate, DAYS_TO_SHOW - 1);
  
  // Determine which months we need to fetch reservations for
  const startMonth = startDate.getMonth() + 1;
  const startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  
  // We need to fetch for both months if they're different
  const monthsToFetch = [
    { month: startMonth, year: startYear },
  ];
  
  // Add the end month if it's different from the start month
  if (startMonth !== endMonth || startYear !== endYear) {
    monthsToFetch.push({ month: endMonth, year: endYear });
  }
  
  // Fetch reservations for all needed months
  const reservationsQueries = useQuery({
    queryKey: ['reservations', 'multi', monthsToFetch],
    queryFn: async () => {
      const promises = monthsToFetch.map(({ month, year }) => 
        getReservationsForMonth(month, year)
      );
      const results = await Promise.all(promises);
      // Flatten the results
      return results.flat();
    }
  });
  
  // Only keep unique reservations - no duplicates
  const reservations = (reservationsQueries.data || []).filter(res => {
    // Show if not blocked or if it's a relationship-based block
    return res.notes !== 'Blocked' || res.sourceReservationId || res.isBlocking;
  });
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  // Navigation functions
  const goForward = () => {
    setStartDate(addDays(startDate, DAYS_TO_SHOW));
  };
  
  const goBackward = () => {
    setStartDate(addDays(startDate, -DAYS_TO_SHOW));
  };
  
  // Generate days array
  const visibleDays = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
    addDays(startDate, i)
  );
  
  // Get reservations for a specific property
  const getReservationsForProperty = (propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  };

  const isLoading = reservationsQueries.isLoading || isLoadingProperties;

  // Helper to normalize date to midnight local time to avoid timezone issues
  const normalizeDate = (date: Date): Date => {
    return startOfDay(date);
  };

  // Get the date range display
  const getDateRangeDisplay = () => {
    if (visibleDays.length === 0) return '';
    
    const firstDay = visibleDays[0];
    const lastDay = visibleDays[visibleDays.length - 1];
    
    // If first and last day are in the same month
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, 'MMMM yyyy')} (${format(firstDay, 'd')}-${format(lastDay, 'd')})`;
    }
    
    // If they span different months
    return `${format(firstDay, 'MMMM d')} - ${format(lastDay, 'MMMM d, yyyy')}`;
  };

  // Calculate lanes for each property and day
  const propertyLanes = useMemo(() => {
    const lanes: Record<string, Record<string, Record<string, number>>> = {};
    
    properties.forEach(property => {
      const propertyId = property.id;
      
      // Skip if no lanes needed for this property
      if (!lanes[propertyId]) {
        lanes[propertyId] = {};
      }
      
      // Get all reservations for this property
      const propertyReservations = getReservationsForProperty(propertyId);
      
      // Process each day
      visibleDays.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        
        // Skip if no lanes needed for this day
        if (!lanes[propertyId][dayKey]) {
          lanes[propertyId][dayKey] = {};
        }
        
        // Get reservations for this day
        const dayReservations = propertyReservations.filter(res => {
          const normalizedStart = normalizeDate(res.startDate);
          const normalizedEnd = normalizeDate(res.endDate);
          const normalizedDay = normalizeDate(day);
          
          return (
            normalizedDay >= normalizedStart && 
            normalizedDay <= normalizedEnd
          );
        });
        
        // Sort reservations by start date for consistent lane assignment
        const sortedReservations = [...dayReservations].sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime()
        );
        
        // Assign lanes to reservations
        sortedReservations.forEach(reservation => {
          // Find the first available lane
          let lane = 0;
          let laneFound = false;
          
          while (!laneFound) {
            laneFound = true;
            
            // Check if this lane is already used by another reservation
            const laneReservations = Object.entries(lanes[propertyId][dayKey]);
            for (const [resId, resLane] of laneReservations) {
              if (resLane === lane) {
                laneFound = false;
                break;
              }
            }
            
            if (!laneFound) {
              lane++;
            }
          }
          
          // Assign lane to this reservation
          lanes[propertyId][dayKey][reservation.id] = lane;
        });
      });
    });
    
    return lanes;
  }, [properties, reservations, visibleDays]);

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
      {/* Fixed header with date range and navigation buttons */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">{getDateRangeDisplay()}</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={goBackward}
              title="Previous 15 Days"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={goForward}
              title="Next 15 Days"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100%-60px)] w-full">
          <div className="relative min-w-max">
            {/* Using fixed grid template with 16 columns (1 property + 15 days) */}
            <div className="grid grid-cols-[160px_repeat(15,minmax(45px,1fr))]">
              {/* Header row with dates */}
              <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
                Properties
              </div>
              
              {/* Date header cells */}
              {visibleDays.map((day, index) => (
                <div 
                  key={`header-${index}`}
                  className={`sticky top-0 z-10 bg-white border-b h-10 flex flex-col items-center justify-center font-medium text-xs ${
                    isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <span>{format(day, 'EEE')}</span>
                  <span>{format(day, 'd MMM')}</span>
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
                    const dayKey = format(day, 'yyyy-MM-dd');
                    
                    // Get reservations that include this day
                    const dayReservations = getReservationsForProperty(property.id).filter(res => {
                      const normalizedStart = normalizeDate(res.startDate);
                      const normalizedEnd = normalizeDate(res.endDate);
                      const normalizedDay = normalizeDate(day);
                      
                      return (
                        normalizedDay >= normalizedStart && 
                        normalizedDay <= normalizedEnd
                      );
                    });
                    
                    return (
                      <div
                        key={`day-${property.id}-${dayIndex}`}
                        className={`border relative min-h-[4rem] h-16 ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        {dayReservations.map((res) => {
                          // Determine if this is start/end of reservation for styling
                          const isStartDay = isSameDay(normalizeDate(res.startDate), normalizeDate(day));
                          const isEndDay = isSameDay(normalizeDate(res.endDate), normalizeDate(day));
                          const isSingleDay = isStartDay && isEndDay;
                          
                          // Get the lane assigned to this reservation
                          const lane = propertyLanes[property.id]?.[dayKey]?.[res.id] || 0;
                          
                          // Calculate vertical position based on lane
                          const laneHeight = 24;
                          const baseOffset = 4;
                          const topPosition = baseOffset + (lane * laneHeight);
                          
                          // Style for the 60/40 rule and borders
                          const leftValue = isStartDay ? '60%' : '0%';
                          const rightValue = isEndDay ? '60%' : '0%';
                          const borderRadius = isSingleDay
                            ? 'rounded-full'
                            : isStartDay
                              ? 'rounded-l-full'
                              : isEndDay
                                ? 'rounded-r-full'
                                : '';
                          
                          // Style based on platform
                          const style = getPlatformColorClass(res.platform);
                          
                          return (
                            <TooltipProvider key={`res-${res.id}-${dayIndex}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`absolute h-5 ${style} ${borderRadius} flex items-center px-1 text-xs text-white font-medium transition-all hover:brightness-90 hover:shadow-md overflow-hidden`}
                                    style={{
                                      top: `${topPosition}px`,
                                      left: leftValue,
                                      right: rightValue,
                                      zIndex: 5
                                    }}
                                  >
                                    {isStartDay && (
                                      <span className="truncate">{res.platform}</span>
                                    )}
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
