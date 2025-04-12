
import React, { useState, useMemo } from 'react';
import { addDays, format, isSameDay, isWithinInterval, addMonths, subMonths, differenceInDays } from 'date-fns';
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

  // Calculate reservation lanes for each property to prevent overlapping
  const propertyReservationLanes = useMemo(() => {
    const lanes: Record<string, Record<string, number>> = {};
    
    properties.forEach(property => {
      const propertyLanes: Record<string, number> = {};
      
      // Get all reservations for this property that overlap with visible days
      let propertyReservations = getReservationsForProperty(property.id).filter(reservation => {
        return visibleDays.some(day => {
          const normalizedDay = normalizeDate(day);
          return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
        });
      });
      
      // Sort reservations by start date to ensure consistent lane assignment
      const sortedReservations = [...propertyReservations].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      
      // Enhanced lane assignment strategy to prioritize consecutive reservations in same lane
      sortedReservations.forEach((reservation, index) => {
        const resId = reservation.id;
        
        // Check if this reservation follows the previous one (consecutive or close)
        if (index > 0) {
          const prevReservation = sortedReservations[index-1];
          const prevResId = prevReservation.id;
          
          // If this reservation starts on the same day the previous one ends or within 3 days
          const daysBetween = differenceInDays(reservation.startDate, prevReservation.endDate);
          if (isSameDay(prevReservation.endDate, reservation.startDate) || 
              (daysBetween >= 0 && daysBetween <= 3)) {
            
            // Try to assign the same lane as the previous reservation
            const prevLane = propertyLanes[prevResId];
            
            // Check if this lane is available for the current reservation
            let canUseSameLane = true;
            
            // Check for conflicts with other reservations in this lane
            for (const existingResId in propertyLanes) {
              if (existingResId === prevResId) continue;
              if (propertyLanes[existingResId] !== prevLane) continue;
              
              const existingRes = propertyReservations.find(r => r.id === existingResId);
              if (!existingRes) continue;
              
              // Check for date overlap
              if (reservation.startDate <= existingRes.endDate && 
                  reservation.endDate >= existingRes.startDate) {
                canUseSameLane = false;
                break;
              }
            }
            
            if (canUseSameLane) {
              propertyLanes[resId] = prevLane;
              return;
            }
          }
        }
        
        // If we couldn't reuse the previous lane, find the first available lane
        let lane = 0;
        let laneFound = false;
        
        while (!laneFound) {
          laneFound = true;
          
          // Check if any existing reservation in this lane overlaps with current reservation
          for (const existingResId in propertyLanes) {
            const existingLane = propertyLanes[existingResId];
            if (existingLane !== lane) continue;
            
            const existingRes = propertyReservations.find(r => r.id === existingResId);
            if (!existingRes) continue;
            
            // Check for date overlap
            if (reservation.startDate <= existingRes.endDate && 
                reservation.endDate >= existingRes.startDate) {
              laneFound = false;
              break;
            }
          }
          
          if (!laneFound) {
            lane++;
          }
        }
        
        // Assign this lane to the reservation
        propertyLanes[resId] = lane;
      });
      
      lanes[property.id] = propertyLanes;
    });
    
    return lanes;
  }, [visibleDays, reservations, properties]);

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
              {properties.map((property: Property) => {
                // Determine max lane for this property to calculate appropriate height
                const propertyLanes = propertyReservationLanes[property.id] || {};
                const maxLane = Object.values(propertyLanes).reduce((max, lane) => Math.max(max, lane), 0);
                const laneHeight = 15; // Height for each reservation lane
                const minCellHeight = 64; // Minimum height for calendar cells
                const rowHeight = Math.max(minCellHeight, minCellHeight + (maxLane * laneHeight));
                
                return (
                  <React.Fragment key={property.id}>
                    {/* Property name (first column) */}
                    <div 
                      className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate flex items-center"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {property.name}
                    </div>
                    
                    {/* Calendar cells for each property */}
                    {visibleDays.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={`day-${property.id}-${dayIndex}`}
                          className={`border relative ${isToday ? 'bg-blue-50' : ''}`}
                          style={{ height: `${rowHeight}px` }}
                        >
                          {/* Reservation rendering will occur outside of the grid */}
                        </div>
                      );
                    })}
                    
                    {/* Reservation bars - rendered outside the grid cells for better positioning */}
                    <div className="col-span-16 relative h-0">
                      {visibleDays.length > 0 && getReservationsForProperty(property.id)
                        .filter(reservation => {
                          // Only show reservations visible in current date range
                          return visibleDays.some(day => {
                            const normalizedDay = normalizeDate(day);
                            return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
                          });
                        })
                        .map((reservation) => {
                          // Work with normalized dates to avoid timezone issues
                          const startDate = reservation.startDate;
                          const endDate = reservation.endDate;
                          
                          // Find exact positions for this reservation within visible days
                          let startPos = -1;
                          let endPos = -1;
                          
                          // Find the position of start and end days
                          for (let i = 0; i < visibleDays.length; i++) {
                            const day = visibleDays[i];
                            const normalizedDay = normalizeDate(day);
                            
                            // Check if this day is the start date or after it
                            if (startPos === -1) {
                              if (isSameDay(normalizedDay, startDate)) {
                                startPos = i;
                              } else if (normalizedDay > startDate) {
                                startPos = i;
                              }
                            }
                            
                            // Check if this day is the end date
                            if (isSameDay(normalizedDay, endDate)) {
                              endPos = i;
                              break;
                            }
                            // If at last day and reservation continues past visible range
                            else if (i === visibleDays.length - 1 && endDate > normalizedDay && startPos !== -1) {
                              endPos = i;
                            }
                          }
                          
                          // If we didn't find a starting position in visible days, don't render
                          if (startPos === -1) return null;
                          
                          // If we found a start but no end, it extends beyond visible range
                          if (endPos === -1 && startPos !== -1) {
                            endPos = visibleDays.length - 1;
                          }
                          
                          // Determine if the reservation continues from/to other periods
                          const continuesFromPrevious = startPos === 0 && !isSameDay(normalizeDate(visibleDays[0]), startDate);
                          const continuesToNext = endPos === visibleDays.length - 1 && !isSameDay(normalizeDate(visibleDays[endPos]), endDate);
                          
                          // Calculate bar width and position with 40-20-40 spacing
                          let barStartPos = startPos;
                          let barEndPos = endPos;
                          
                          // If this is the actual check-in day (40-20-40 rule)
                          if (isSameDay(normalizeDate(visibleDays[startPos]), startDate)) {
                            barStartPos += 0.6; // Start at 60% of the cell width
                          }
                          
                          // If this is the actual check-out day (40-20-40 rule)
                          if (isSameDay(normalizeDate(visibleDays[endPos]), endDate)) {
                            barEndPos += 0.4; // End at 40% of the cell width
                          } else {
                            // If not the actual check-out day, bar extends to end of cell
                            barEndPos += 1;
                          }
                          
                          // Calculate position on the grid
                          const leftStart = barStartPos + 1; // +1 for the property name column
                          const width = barEndPos - barStartPos;
                          
                          // Define border radius style based on continuity
                          let borderRadiusStyle = 'rounded-full';
                          if (continuesFromPrevious && continuesToNext) {
                            borderRadiusStyle = 'rounded-none';
                          } else if (continuesFromPrevious) {
                            borderRadiusStyle = 'rounded-r-full rounded-l-none';
                          } else if (continuesToNext) {
                            borderRadiusStyle = 'rounded-l-full rounded-r-none';
                          }
                          
                          // Get the lane assigned to this reservation
                          const propertyLanes = propertyReservationLanes[property.id] || {};
                          const lane = propertyLanes[reservation.id] || 0;
                          
                          // Calculate vertical position based on lane
                          const laneHeight = 15; // Height per lane
                          const baseOffset = 16; // Base offset from top
                          const top = baseOffset + (lane * laneHeight);
                          
                          // Determine text size based on reservation width
                          const isShortReservation = width < 1;
                          
                          return (
                            <TooltipProvider key={`res-${property.id}-${reservation.id}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`absolute h-5 ${getPlatformColorClass(reservation.platform)} ${borderRadiusStyle} flex items-center px-1 text-xs text-white font-medium transition-all hover:brightness-90 hover:shadow-md overflow-hidden`}
                                    style={{
                                      top: `${top}px`,
                                      left: `calc(${leftStart} * 100% / 16)`,
                                      width: `calc(${width} * 100% / 16)`,
                                      minWidth: '40px',
                                      zIndex: 10
                                    }}
                                  >
                                    {!isShortReservation && reservation.platform}
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
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default MultiCalendar;
