
import React, { useState, useMemo, useCallback } from 'react';
import { addDays, format, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Link } from 'lucide-react';
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
    // Show all regular reservations
    if (res.notes !== 'Blocked') return true;
    
    // Also show related blocks (with sourceReservationId or isBlocking=true)
    if (res.sourceReservationId || res.isBlocking) return true;
    
    // Hide normal 'Blocked' without relationships
    return false;
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
  
  // Helper to normalize date to midnight local time to avoid timezone issues
  const normalizeDate = useCallback((date: Date): Date => {
    return startOfDay(date);
  }, []);

  // Get reservations for a specific property
  const getReservationsForProperty = useCallback((propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  }, [reservations]);

  // Get parent-child relationship mapping
  const propertyRelationships = useMemo(() => {
    const relationships = new Map<string, string[]>();
    const childToParent = new Map<string, string>();
    
    // Build relationships map
    properties.forEach(property => {
      if (property.type === 'parent') {
        // Initialize an array for this parent's children
        relationships.set(property.id, []);
      } else if (property.type === 'child' && property.parentId) {
        // Add this child to its parent's array
        const children = relationships.get(property.parentId) || [];
        children.push(property.id);
        relationships.set(property.parentId, children);
        
        // Also record child-to-parent mapping
        childToParent.set(property.id, property.parentId);
      }
    });
    
    return { parentToChildren: relationships, childToParent };
  }, [properties]);

  const isLoading = reservationsQueries.isLoading || isLoadingProperties;

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

  // Stable sorting function for reservations to ensure consistent lane assignments
  const sortReservations = useCallback((resA: Reservation, resB: Reservation): number => {
    // First sort by start date
    const startDiff = resA.startDate.getTime() - resB.startDate.getTime();
    if (startDiff !== 0) return startDiff;
    
    // Then by end date (longer reservations first)
    const endDiff = resB.endDate.getTime() - resA.endDate.getTime();
    if (endDiff !== 0) return endDiff;
    
    // Then by ID for consistent ordering of same-date reservations
    return resA.id.localeCompare(resB.id);
  }, []);

  // Calculate lanes for each property and reservation globally
  const propertyLanes = useMemo(() => {
    // Map to store global lane assignments: key = reservationId, value = lane number
    const laneMap = new Map<string, number>();
    
    // Process each property to assign global lanes
    properties.forEach(property => {
      const propertyReservations = getReservationsForProperty(property.id);
      
      // Sort reservations consistently
      const sortedReservations = [...propertyReservations].sort(sortReservations);
      
      // Track end dates for each lane
      const lanesToEndDates = new Map<number, Date>();
      
      // Process each reservation
      sortedReservations.forEach(reservation => {
        const reservationStart = normalizeDate(reservation.startDate);
        const reservationEnd = normalizeDate(reservation.endDate);
        
        // Find the first available lane
        let lane = 0;
        let foundLane = false;
        
        // Check if we can fit this reservation in an existing lane
        while (!foundLane) {
          const endDate = lanesToEndDates.get(lane);
          
          // If lane doesn't exist or ends before current reservation starts
          if (!endDate || endDate < reservationStart) {
            foundLane = true;
            lanesToEndDates.set(lane, reservationEnd);
            laneMap.set(`${property.id}-${reservation.id}`, lane);
          } else {
            // Try next lane
            lane++;
          }
        }
      });
    });
    
    return laneMap;
  }, [properties, getReservationsForProperty, normalizeDate, sortReservations]);

  // Helper to get the UI style for a reservation
  const getReservationStyle = useCallback((reservation: Reservation): string => {
    // If this is a related block
    if (reservation.status === 'Blocked' && (reservation.sourceReservationId || reservation.isBlocking)) {
      return 'bg-gray-400 text-white border border-dashed border-white';
    }
    
    // Regular reservation
    return getPlatformColorClass(reservation.platform);
  }, []);

  // Find source property for a blocking reservation
  const getSourceReservationInfo = useCallback((reservation: Reservation): { property?: Property, reservation?: Reservation } => {
    if (!reservation.sourceReservationId) return {};
    
    const sourceReservation = reservations.find(r => r.id === reservation.sourceReservationId);
    if (!sourceReservation) return {};
    
    const sourceProperty = properties.find(p => p.id === sourceReservation.propertyId);
    
    return { property: sourceProperty, reservation: sourceReservation };
  }, [reservations, properties]);

  // Check if a day has any parent or related child reservations
  const getDayReservationStatus = useCallback((property: Property, day: Date) => {
    const normalizedDay = normalizeDate(day);
    
    // Get direct reservations for this property
    const directReservations = getReservationsForProperty(property.id).filter(res => {
      const normalizedStart = normalizeDate(res.startDate);
      const normalizedEnd = normalizeDate(res.endDate);
      return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
    });
    
    // If there are direct reservations, return them
    if (directReservations.length > 0) {
      return { 
        hasReservation: true, 
        isIndirect: false,
        reservations: directReservations
      };
    }
    
    // For parent properties, check if any child is reserved
    if (property.type === 'parent') {
      const childrenIds = propertyRelationships.parentToChildren.get(property.id) || [];
      
      // Check if any child property has a reservation on this day
      for (const childId of childrenIds) {
        const childReservations = getReservationsForProperty(childId).filter(res => {
          const normalizedStart = normalizeDate(res.startDate);
          const normalizedEnd = normalizeDate(res.endDate);
          return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
        });
        
        if (childReservations.length > 0) {
          // There's at least one child with a reservation
          return { 
            hasReservation: true, 
            isIndirect: true,
            reservations: childReservations
          };
        }
      }
    }
    
    // For child properties, check if parent is reserved
    if (property.type === 'child' && property.parentId) {
      const parentReservations = getReservationsForProperty(property.parentId).filter(res => {
        const normalizedStart = normalizeDate(res.startDate);
        const normalizedEnd = normalizeDate(res.endDate);
        return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
      });
      
      if (parentReservations.length > 0) {
        return { 
          hasReservation: true, 
          isIndirect: true,
          reservations: parentReservations
        };
      }
    }
    
    // No reservations found
    return { 
      hasReservation: false, 
      isIndirect: false,
      reservations: []
    };
  }, [getReservationsForProperty, normalizeDate, properties, propertyRelationships.parentToChildren]);

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
                // Get type indicator for property
                const typeIndicator = 
                  property.type === 'parent' ? 'Alojamiento principal' : 
                  property.type === 'child' ? 'Habitación' : '';
                
                return (
                  <React.Fragment key={property.id}>
                    {/* Property name (first column) */}
                    <div className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate h-16">
                      <div className="flex flex-col">
                        <span>{property.name}</span>
                        {typeIndicator && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {typeIndicator}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Calendar cells for each property */}
                    {visibleDays.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      const normalizedDay = normalizeDate(day);
                      
                      // Get reservation status for this day
                      const { 
                        hasReservation, 
                        isIndirect, 
                        reservations: dayReservations 
                      } = getDayReservationStatus(property, day);
                      
                      // Sort reservations for consistent display order
                      const sortedDayReservations = [...dayReservations].sort(sortReservations);
                      
                      // Apply background color to indicate status
                      let bgColorClass = isToday ? 'bg-blue-50' : '';
                      
                      // Add status indicator for cells without visible reservations
                      if (hasReservation && sortedDayReservations.length === 0) {
                        // This is for cells affected by parent/child relationships
                        bgColorClass = isIndirect ? 'bg-gray-100' : bgColorClass;
                      }
                      
                      return (
                        <div
                          key={`day-${property.id}-${dayIndex}`}
                          className={`border relative min-h-[4rem] h-16 ${bgColorClass}`}
                        >
                          {hasReservation && isIndirect && sortedDayReservations.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            </div>
                          )}
                          
                          {sortedDayReservations.map((res) => {
                            // Determine if this is start/end of reservation for styling
                            const isStartDay = isSameDay(normalizeDate(res.startDate), normalizedDay);
                            const isEndDay = isSameDay(normalizeDate(res.endDate), normalizedDay);
                            const isSingleDay = isStartDay && isEndDay;
                            
                            // Get the lane assigned to this reservation
                            const lane = propertyLanes.get(`${property.id}-${res.id}`) || 0;
                            
                            // Calculate vertical position based on lane
                            const laneHeight = 24; // Height for each lane
                            const baseOffset = 4;  // Base padding from the top
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
                            
                            // Style based on platform/type
                            const style = getReservationStyle(res);
                            
                            // Get source info for related blocks
                            const sourceInfo = getSourceReservationInfo(res);
                            
                            return (
                              <TooltipProvider key={`res-${res.id}-${dayIndex}`}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className={`absolute h-5 ${style} ${borderRadius} flex items-center px-1 text-xs font-medium transition-all hover:brightness-90 hover:shadow-md overflow-hidden`}
                                      style={{
                                        top: `${topPosition}px`,
                                        left: leftValue,
                                        right: rightValue,
                                        zIndex: 5
                                      }}
                                    >
                                      {isStartDay && (
                                        <span className="truncate">
                                          {res.sourceReservationId ? (
                                            <Link className="h-3 w-3 inline mr-1" />
                                          ) : null}
                                          {res.platform}
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <p><strong>{property.name}</strong></p>
                                      <p><strong>Platform:</strong> {res.platform}</p>
                                      <p><strong>Check-in:</strong> {format(res.startDate, 'MMM d, yyyy')}</p>
                                      <p><strong>Check-out:</strong> {format(res.endDate, 'MMM d, yyyy')}</p>
                                      
                                      {sourceInfo.property && (
                                        <p className="text-muted-foreground mt-1">
                                          <em>Bloqueado por reserva en {sourceInfo.property.name}</em>
                                        </p>
                                      )}
                                      
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
