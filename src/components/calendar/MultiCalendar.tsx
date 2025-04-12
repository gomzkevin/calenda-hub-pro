
import React, { useState, useMemo, useCallback } from 'react';
import { addDays, format, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the number of days to show in the multi-calendar view
const DAYS_TO_SHOW = 15;

const MultiCalendar: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const endDate = addDays(startDate, DAYS_TO_SHOW - 1);
  const startMonth = startDate.getMonth() + 1;
  const startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  
  const monthsToFetch = [
    { month: startMonth, year: startYear },
  ];
  
  if (startMonth !== endMonth || startYear !== endYear) {
    monthsToFetch.push({ month: endMonth, year: endYear });
  }
  
  const reservationsQueries = useQuery({
    queryKey: ['reservations', 'multi', monthsToFetch],
    queryFn: async () => {
      const promises = monthsToFetch.map(({ month, year }) => 
        getReservationsForMonth(month, year)
      );
      const results = await Promise.all(promises);
      return results.flat();
    }
  });
  
  const reservations = (reservationsQueries.data || []).filter(res => {
    if (res.notes !== 'Blocked') return true;
    if (res.sourceReservationId || res.isBlocking) return true;
    return false;
  });
  
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const goForward = () => {
    setStartDate(addDays(startDate, DAYS_TO_SHOW));
  };
  
  const goBackward = () => {
    setStartDate(addDays(startDate, -DAYS_TO_SHOW));
  };
  
  const visibleDays = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
    addDays(startDate, i)
  );
  
  const normalizeDate = useCallback((date: Date): Date => {
    return startOfDay(date);
  }, []);

  const getReservationsForProperty = useCallback((propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  }, [reservations]);

  const propertyRelationships = useMemo(() => {
    const relationships = new Map<string, string[]>();
    const childToParent = new Map<string, string>();
    
    properties.forEach(property => {
      if (property.type === 'parent') {
        relationships.set(property.id, []);
      } else if (property.type === 'child' && property.parentId) {
        const children = relationships.get(property.parentId) || [];
        children.push(property.id);
        relationships.set(property.parentId, children);
        
        childToParent.set(property.id, property.parentId);
      }
    });
    
    return { parentToChildren: relationships, childToParent };
  }, [properties]);

  const isLoading = reservationsQueries.isLoading || isLoadingProperties;

  const getDateRangeDisplay = () => {
    if (visibleDays.length === 0) return '';
    
    const firstDay = visibleDays[0];
    const lastDay = visibleDays[visibleDays.length - 1];
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, 'MMMM yyyy')} (${format(firstDay, 'd')}-${format(lastDay, 'd')})`;
    }
    
    return `${format(firstDay, 'MMMM d')} - ${format(lastDay, 'MMMM d, yyyy')}`;
  };

  const sortReservations = useCallback((resA: Reservation, resB: Reservation): number => {
    const startDiff = resA.startDate.getTime() - resB.startDate.getTime();
    if (startDiff !== 0) return startDiff;
    
    const endDiff = resB.endDate.getTime() - resA.endDate.getTime();
    if (endDiff !== 0) return endDiff;
    
    return resA.id.localeCompare(resB.id);
  }, []);

  const propertyLanes = useMemo(() => {
    const laneMap = new Map<string, number>();
    
    properties.forEach(property => {
      const propertyReservations = getReservationsForProperty(property.id);
      
      const sortedReservations = [...propertyReservations].sort(sortReservations);
      
      const lanesToEndDates = new Map<number, Date>();
      
      sortedReservations.forEach(reservation => {
        const reservationStart = normalizeDate(reservation.startDate);
        const reservationEnd = normalizeDate(reservation.endDate);
        
        let lane = 0;
        let foundLane = false;
        
        while (!foundLane) {
          const endDate = lanesToEndDates.get(lane);
          
          if (!endDate || endDate < reservationStart) {
            foundLane = true;
            lanesToEndDates.set(lane, reservationEnd);
            laneMap.set(`${property.id}-${reservation.id}`, lane);
          } else {
            lane++;
          }
        }
      });
    });
    
    return laneMap;
  }, [properties, getReservationsForProperty, normalizeDate, sortReservations]);

  const getReservationStyle = useCallback((reservation: Reservation, isIndirect = false): string => {
    if (isIndirect) {
      return 'bg-gray-100 text-gray-500 border border-dashed border-gray-300';
    }
    
    if (reservation.status === 'Blocked' && (reservation.sourceReservationId || reservation.isBlocking)) {
      return 'bg-gray-400 text-white border border-dashed border-white';
    }
    
    return getPlatformColorClass(reservation.platform);
  }, []);

  const getSourceReservationInfo = useCallback((reservation: Reservation): { property?: Property, reservation?: Reservation } => {
    if (!reservation.sourceReservationId) return {};
    
    const sourceReservation = reservations.find(r => r.id === reservation.sourceReservationId);
    if (!sourceReservation) return {};
    
    const sourceProperty = properties.find(p => p.id === sourceReservation.propertyId);
    
    return { property: sourceProperty, reservation: sourceReservation };
  }, [reservations, properties]);

  const getDayReservationStatus = useCallback((property: Property, day: Date) => {
    const normalizedDay = normalizeDate(day);
    
    const directReservations = getReservationsForProperty(property.id).filter(res => {
      const normalizedStart = normalizeDate(res.startDate);
      const normalizedEnd = normalizeDate(res.endDate);
      return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
    });
    
    if (directReservations.length > 0) {
      return { 
        hasReservation: true, 
        isIndirect: false,
        reservations: directReservations
      };
    }
    
    if (property.type === 'parent') {
      const childrenIds = propertyRelationships.parentToChildren.get(property.id) || [];
      
      for (const childId of childrenIds) {
        const childReservations = getReservationsForProperty(childId).filter(res => {
          const normalizedStart = normalizeDate(res.startDate);
          const normalizedEnd = normalizeDate(res.endDate);
          return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
        });
        
        if (childReservations.length > 0) {
          return { 
            hasReservation: true, 
            isIndirect: true,
            reservations: childReservations
          };
        }
      }
    }
    
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
    
    return { 
      hasReservation: false, 
      isIndirect: false,
      reservations: []
    };
  }, [getReservationsForProperty, normalizeDate, properties, propertyRelationships.parentToChildren]);

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
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
            <div className="grid grid-cols-[160px_repeat(15,minmax(45px,1fr))]">
              <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
                Properties
              </div>
              
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
              
              {properties.map((property: Property) => {
                const typeIndicator = 
                  property.type === 'parent' ? 'Alojamiento principal' : 
                  property.type === 'child' ? 'Habitación' : '';
                
                return (
                  <React.Fragment key={property.id}>
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
                    
                    {visibleDays.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      const normalizedDay = normalizeDate(day);
                      
                      const { 
                        hasReservation, 
                        isIndirect, 
                        reservations: dayReservations 
                      } = getDayReservationStatus(property, day);
                      
                      const sortedDayReservations = [...dayReservations].sort(sortReservations);
                      
                      let bgColorClass = isToday ? 'bg-blue-50' : '';
                      
                      if (hasReservation && sortedDayReservations.length === 0) {
                        bgColorClass = isIndirect ? 'bg-gray-100' : bgColorClass;
                      }
                      
                      return (
                        <div
                          key={`day-${property.id}-${dayIndex}`}
                          className={`border relative min-h-[4rem] h-16 ${bgColorClass}`}
                        >
                          {hasReservation && isIndirect && sortedDayReservations.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            </div>
                          )}
                          
                          {sortedDayReservations.map((res) => {
                            const isStartDay = isSameDay(normalizeDate(res.startDate), normalizedDay);
                            const isEndDay = isSameDay(normalizeDate(res.endDate), normalizedDay);
                            const isSingleDay = isStartDay && isEndDay;
                            
                            const lane = propertyLanes.get(`${property.id}-${res.id}`) || 0;
                            
                            const laneHeight = 24;
                            const baseOffset = 4;
                            const topPosition = baseOffset + (lane * laneHeight);
                            
                            const leftValue = isStartDay ? '60%' : '0%';
                            const rightValue = isEndDay ? '60%' : '0%';
                            const borderRadius = isSingleDay
                              ? 'rounded-full'
                              : isStartDay
                                ? 'rounded-l-full'
                                : isEndDay
                                  ? 'rounded-r-full'
                                  : '';
                            
                            const isIndirectReservation = 
                              (property.type === 'parent' && res.propertyId !== property.id) || 
                              (property.type === 'child' && res.propertyId !== property.id);
                            
                            const style = getReservationStyle(res, isIndirectReservation);
                            
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
