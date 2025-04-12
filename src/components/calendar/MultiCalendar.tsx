import React, { useState } from 'react';
import { addDays, format, isSameDay, isWithinInterval, addMonths, subMonths } from 'date-fns';
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

  // Helper to normalize date to noon UTC to avoid timezone issues
  const normalizeDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCHours(12, 0, 0, 0);
    return newDate;
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
  
  // Find all days for a given reservation
  const getReservationDays = (reservation: Reservation) => {
    return visibleDays.filter(day => {
      const normalizedDay = normalizeDate(day);
      return (
        normalizedDay >= normalizeDate(reservation.startDate) && 
        normalizedDay <= normalizeDate(reservation.endDate)
      );
    });
  };

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
                    
                    return (
                      <div
                        key={`day-${property.id}-${dayIndex}`}
                        className={`border relative min-h-[4rem] h-16 ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        {/* Empty cell - actual reservations are rendered in a separate layer */}
                      </div>
                    );
                  })}
                  
                  {/* Reservation layer */}
                  {getReservationsForProperty(property.id).map(reservation => {
                    // Get all days that this reservation spans within the visible range
                    const reservationDays = getReservationDays(reservation);
                    
                    if (reservationDays.length === 0) return null;
                    
                    // Check if this reservation starts before our visible range
                    const startsBeforeVisibleRange = normalizeDate(reservation.startDate) < normalizeDate(visibleDays[0]);
                    
                    // Check if this reservation ends after our visible range
                    const endsAfterVisibleRange = normalizeDate(reservation.endDate) > normalizeDate(visibleDays[visibleDays.length - 1]);
                    
                    // Find the index of the first day of this reservation in our visible range
                    const firstVisibleDayIndex = visibleDays.findIndex(day => 
                      isSameDay(normalizeDate(day), normalizeDate(reservationDays[0]))
                    );
                    
                    // Find the index of the last day of this reservation in our visible range
                    const lastVisibleDayIndex = visibleDays.findIndex(day => 
                      isSameDay(normalizeDate(day), normalizeDate(reservationDays[reservationDays.length - 1]))
                    );
                    
                    if (firstVisibleDayIndex === -1 || lastVisibleDayIndex === -1) return null;
                    
                    // Determine border radius based on whether the reservation starts/ends within the visible range
                    const borderRadius = `
                      ${!startsBeforeVisibleRange ? 'rounded-l-full' : ''}
                      ${!endsAfterVisibleRange ? 'rounded-r-full' : ''}
                    `;
                    
                    // Calculate the grid column positioning
                    // Columns start at 2 because the first column is for property names
                    const gridColumnStart = firstVisibleDayIndex + 2; // +2 because grid columns are 1-indexed and we have the property column
                    const gridColumnEnd = lastVisibleDayIndex + 3; // +3 because grid columns are inclusive and we need to go to the next column
                    
                    // Determine if the cell is the true start/end of the reservation
                    const isRealStartDay = isSameDay(normalizeDate(visibleDays[firstVisibleDayIndex]), normalizeDate(reservation.startDate));
                    const isRealEndDay = isSameDay(normalizeDate(visibleDays[lastVisibleDayIndex]), normalizeDate(reservation.endDate));
                    
                    // Apply special styling for start/end days using clip-path
                    let clipPath = '';
                    
                    if (isRealStartDay && isRealEndDay) {
                      // For a single-day reservation, clip both sides
                      clipPath = 'inset(0 40% 0 40%)';
                    } else if (isRealStartDay) {
                      // For start day, clip the left 60%
                      clipPath = 'inset(0 0 0 60%)';
                    } else if (isRealEndDay) {
                      // For end day, clip the right 60%
                      clipPath = 'inset(0 60% 0 0)';
                    }
                    
                    // Get platform color class
                    const colorClass = getPlatformColorClass(reservation.platform);
                    
                    return (
                      <TooltipProvider key={`res-${property.id}-${reservation.id}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`absolute h-6 ${colorClass} ${borderRadius} flex items-center px-1 text-xs font-medium text-white z-10 transition-all hover:brightness-90 hover:shadow-md overflow-hidden`}
                              style={{
                                gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                                top: '50%', // Center vertically
                                transform: 'translateY(-50%)',
                                left: isRealStartDay ? 'calc(60%)' : 0,
                                right: isRealEndDay ? 'calc(60%)' : 0,
                                clipPath: clipPath || 'none'
                              }}
                            >
                              {/* Only show platform name on the first visible day */}
                              {firstVisibleDayIndex === dayIndex && reservation.platform}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p><strong>{property.name}</strong></p>
                              <p><strong>Platform:</strong> {reservation.platform}</p>
                              <p><strong>Check-in:</strong> {format(reservation.startDate, 'MMM d, yyyy')}</p>
                              <p><strong>Check-out:</strong> {format(reservation.endDate, 'MMM d, yyyy')}</p>
                              {reservation.notes && reservation.notes !== 'Blocked' && (
                                <p><strong>Notes:</strong> {reservation.notes}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
