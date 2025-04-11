
import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [cellWidth, setCellWidth] = useState<number>(50);
  const [visibleDays, setVisibleDays] = useState<number>(31);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Use useLayoutEffect for initial measurements before rendering
  useLayoutEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = Math.max(0, containerWidth - 160);
      
      let newCellWidth;
      let daysToShow;
      
      if (window.innerWidth < 640) {
        newCellWidth = 40;
        daysToShow = Math.max(5, Math.floor(availableWidth / newCellWidth));
      } else if (window.innerWidth < 1024) {
        newCellWidth = 45;
        daysToShow = Math.max(10, Math.floor(availableWidth / newCellWidth));
      } else {
        newCellWidth = 50;
        daysToShow = Math.max(15, Math.floor(availableWidth / newCellWidth));
      }
      
      setCellWidth(newCellWidth);
      setVisibleDays(Math.min(daysToShow, 31));
      setIsMounted(true);
    };
    
    calculateLayout();
    
    const resizeObserver = new ResizeObserver(calculateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', calculateLayout);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateLayout);
    };
  }, []);
  
  const { data: allReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', 'multi', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getReservationsForMonth(
      currentMonth.getMonth() + 1, 
      currentMonth.getFullYear()
    )
  });
  
  const reservations = allReservations.filter(res => {
    return res.notes !== 'Blocked' || res.sourceReservationId || res.isBlocking;
  });
  
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
  
  const visibleMonthDays = monthDays.slice(0, visibleDays);
  
  const getReservationsForProperty = (propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  };

  const isLoading = isLoadingReservations || isLoadingProperties || !isMounted;

  const normalizeDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCHours(12, 0, 0, 0);
    return newDate;
  };

  const propertyReservationLanes = useMemo(() => {
    const lanes: Record<string, Record<string, number>> = {};
    
    properties.forEach(property => {
      const propertyId = property.id;
      const propertyReservations = getReservationsForProperty(propertyId);
      
      const sortedReservations = [...propertyReservations].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      
      const propertyLanes: Record<string, number> = {};
      
      sortedReservations.forEach((reservation, index) => {
        const resId = reservation.id;
        
        if (index > 0) {
          const prevReservation = sortedReservations[index-1];
          const prevResId = prevReservation.id;
          
          const daysBetween = differenceInDays(reservation.startDate, prevReservation.endDate);
          if (isSameDay(prevReservation.endDate, reservation.startDate) || 
              (daysBetween >= 0 && daysBetween <= 3)) {
            
            const prevLane = propertyLanes[prevResId];
            
            let canUseSameLane = true;
            
            for (const existingResId in propertyLanes) {
              if (existingResId === prevResId) continue;
              if (propertyLanes[existingResId] !== prevLane) continue;
              
              const existingRes = propertyReservations.find(r => r.id === existingResId);
              if (!existingRes) continue;
              
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
        
        let lane = 0;
        let laneFound = false;
        
        while (!laneFound) {
          laneFound = true;
          
          for (const existingResId in propertyLanes) {
            const existingLane = propertyLanes[existingResId];
            if (existingLane !== lane) continue;
            
            const existingRes = propertyReservations.find(r => r.id === existingResId);
            if (!existingRes) continue;
            
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
        
        propertyLanes[resId] = lane;
      });
      
      lanes[propertyId] = propertyLanes;
    });
    
    return lanes;
  }, [properties, reservations]);

  // Calculate row positions to correctly place reservation lanes
  const calculateRowPositions = useMemo(() => {
    const positions: Record<string, number> = {};
    let currentPosition = 40; // Starting position after header
    
    properties.forEach((property, index) => {
      positions[property.id] = currentPosition;
      
      const propertyLanes = propertyReservationLanes[property.id] || {};
      const maxLane = Object.values(propertyLanes).reduce((max, lane) => Math.max(max, lane), 0);
      const totalLanes = maxLane + 1;
      const laneHeight = 16;
      const baseRowHeight = 48;
      const rowHeight = Math.max(baseRowHeight, totalLanes * laneHeight + 12);
      
      // Add current row height to get next row position
      currentPosition += rowHeight;
    });
    
    return positions;
  }, [properties, propertyReservationLanes]);
  
  const getReservationStyle = (reservation: Reservation) => {
    if (reservation.notes === 'Blocked' && reservation.sourceReservationId) {
      return 'bg-gray-400 opacity-70 border border-dashed border-white';
    }
    
    return getPlatformColorClass(reservation.platform);
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-full w-full p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full w-full max-w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2">
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
        <div className="h-full w-full overflow-auto border rounded-md">
          <div className="min-w-full" style={{ 
            width: `max(100%, ${160 + (visibleMonthDays.length * cellWidth)}px)`
          }}>
            <div className="grid" style={{ 
              gridTemplateColumns: `160px repeat(${visibleMonthDays.length}, ${cellWidth}px)`,
            }}>
              <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
                Properties
              </div>
              
              {visibleMonthDays.map((day, index) => (
                <div 
                  key={index}
                  className="sticky top-0 z-10 bg-white border-b h-10 flex flex-col items-center justify-center font-medium text-xs"
                >
                  <span>{format(day, 'EEE')}</span>
                  <span>{format(day, 'd')}</span>
                </div>
              ))}
              
              {properties.map((property: Property, propertyIndex: number) => {
                const propertyReservations = getReservationsForProperty(property.id);
                const propertyLanes = propertyReservationLanes[property.id] || {};
                const laneHeight = 16;
                const baseRowHeight = 48;
                
                const maxLane = Object.values(propertyLanes).reduce((max, lane) => Math.max(max, lane), 0);
                const totalLanes = maxLane + 1;
                const rowHeight = Math.max(baseRowHeight, totalLanes * laneHeight + 12);
                const rowTopPosition = calculateRowPositions[property.id] || 0;
                
                return (
                  <React.Fragment key={property.id}>
                    <div 
                      className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {property.name}
                    </div>
                    
                    {visibleMonthDays.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`border ${isToday ? 'bg-blue-50' : ''}`}
                          style={{ height: `${rowHeight}px` }}
                        />
                      );
                    })}

                    {propertyReservations.map((reservation) => {
                      const startDate = reservation.startDate;
                      const endDate = reservation.endDate;
                      
                      if (endDate < visibleMonthDays[0] || startDate > visibleMonthDays[visibleMonthDays.length - 1]) {
                        return null;
                      }
                      
                      const visibleStartDate = startDate < visibleMonthDays[0] ? visibleMonthDays[0] : startDate;
                      const visibleEndDate = endDate > visibleMonthDays[visibleMonthDays.length - 1] ? 
                        visibleMonthDays[visibleMonthDays.length - 1] : endDate;
                      
                      const startDayIndex = visibleMonthDays.findIndex(d => 
                        isSameDay(normalizeDate(d), visibleStartDate)
                      );
                      
                      let endDayIndex = visibleMonthDays.findIndex(d => 
                        isSameDay(normalizeDate(d), visibleEndDate)
                      );
                      
                      if (endDayIndex === -1) {
                        endDayIndex = visibleMonthDays.length - 1;
                      }
                      
                      let startPosition = startDayIndex;
                      let endPosition = endDayIndex;
                      
                      if (isSameDay(visibleStartDate, startDate)) {
                        startPosition += 0.6;
                      }
                      
                      if (isSameDay(visibleEndDate, endDate)) {
                        endPosition += 0.4;
                      } else {
                        endPosition += 1;
                      }
                      
                      const left = `calc(160px + (${startPosition} * ${cellWidth}px))`;
                      const width = `calc(${(endPosition - startPosition)} * ${cellWidth}px)`;
                      
                      const isStartTruncated = startDate < visibleMonthDays[0];
                      const isEndTruncated = endDate > visibleMonthDays[visibleMonthDays.length - 1];
                      
                      let borderRadiusStyle = 'rounded-full';
                      if (isStartTruncated && isEndTruncated) {
                        borderRadiusStyle = 'rounded-none';
                      } else if (isStartTruncated) {
                        borderRadiusStyle = 'rounded-r-full rounded-l-none';
                      } else if (isEndTruncated) {
                        borderRadiusStyle = 'rounded-l-full rounded-r-none';
                      }
                      
                      const lane = propertyLanes[reservation.id] || 0;
                      
                      // Calculate the vertical offset for each lane
                      // Start from the middle of the row and distribute lanes evenly
                      let verticalPosition;
                      
                      if (totalLanes <= 1) {
                        // If there's only one lane, center it vertically within the row
                        verticalPosition = rowTopPosition + (rowHeight / 2) - 16;
                      } else {
                        // For multiple lanes, position them properly within the row
                        const laneSpacing = (rowHeight - 16) / totalLanes;
                        verticalPosition = rowTopPosition + 8 + (lane * laneSpacing);
                      }
                      
                      const isShortReservation = endPosition - startPosition < 1;
                      
                      const reservationClass = getReservationStyle(reservation);
                      
                      let sourcePropertyInfo = '';
                      if (reservation.notes === 'Blocked' && reservation.sourceReservationId) {
                        const sourceReservation = allReservations.find(r => r.id === reservation.sourceReservationId);
                        if (sourceReservation) {
                          const sourceProperty = properties.find(p => p.id === sourceReservation.propertyId);
                          if (sourceProperty) {
                            sourcePropertyInfo = `Bloqueado por reserva en: ${sourceProperty.name}`;
                          }
                        }
                      }
                      
                      if (startPosition < 0 && endPosition < 0) return null;
                      if (startPosition >= visibleMonthDays.length && endPosition >= visibleMonthDays.length) return null;
                      
                      return (
                        <TooltipProvider key={`reservation-${property.id}-${reservation.id}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`absolute h-8 ${reservationClass} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium ${isShortReservation ? 'text-xs' : 'text-sm'} z-10 transition-all hover:brightness-90 hover:shadow-md`}
                                style={{
                                  top: `${verticalPosition}px`,
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
                                <p><strong>Check-in:</strong> {format(startDate, 'MMM d, yyyy')}</p>
                                <p><strong>Check-out:</strong> {format(endDate, 'MMM d, yyyy')}</p>
                                {sourcePropertyInfo && (
                                  <p className="mt-1 text-gray-500"><em>{sourcePropertyInfo}</em></p>
                                )}
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
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
