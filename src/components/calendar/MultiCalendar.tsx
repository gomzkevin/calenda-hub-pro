import React, { useState, useMemo, useEffect } from 'react';
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

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = useIsMobile();
  
  // Resize listener for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate cell width based on screen size
  const calculateCellWidth = () => {
    if (windowWidth < 640) return 40; // Mobile
    if (windowWidth < 1024) return 45; // Tablet
    return 50; // Desktop
  };
  
  const cellWidth = calculateCellWidth();
  
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
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
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

  // Compute reservation lanes for each property
  const propertyReservationLanes = useMemo(() => {
    const lanes: Record<string, Record<string, number>> = {};
    
    properties.forEach(property => {
      const propertyId = property.id;
      const propertyReservations = getReservationsForProperty(propertyId);
      
      // Sort reservations by start date to ensure consistent lane assignment
      const sortedReservations = [...propertyReservations].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      
      // Track lane assignments for this property
      const propertyLanes: Record<string, number> = {};
      
      // Enhanced lane assignment strategy to prioritize consecutive reservations in same lane
      sortedReservations.forEach((reservation, index) => {
        // Generate a unique ID for this reservation
        const resId = reservation.id;
        
        // Check if this reservation follows the previous one (consecutive or within a few days)
        if (index > 0) {
          const prevReservation = sortedReservations[index-1];
          const prevResId = prevReservation.id;
          
          // If this reservation starts on the same day as the previous one ends or within 3 days
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
      
      lanes[propertyId] = propertyLanes;
    });
    
    return lanes;
  }, [properties, reservations]);
  
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
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
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
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="relative overflow-auto flex-1 h-full" style={{ maxHeight: "calc(100% - 60px)" }}>
          <div className="min-w-max">
            <div className="grid" style={{ 
              gridTemplateColumns: `200px repeat(${monthDays.length}, ${cellWidth}px)`,
            }}>
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
              {properties.map((property: Property, propertyIndex: number) => {
                const propertyReservations = getReservationsForProperty(property.id);
                const propertyLanes = propertyReservationLanes[property.id] || {};
                const laneHeight = 12; // Height for each reservation lane in pixels
                const baseRowHeight = 48; // Base height for property row
                
                // Calculate appropriate row height based on number of lanes
                const maxLane = Object.values(propertyLanes).reduce((max, lane) => Math.max(max, lane), 0);
                const rowHeight = baseRowHeight + (maxLane * laneHeight);
                
                // Calculate the starting vertical position for this property row
                let rowTopPosition = 10; // Header height
                for (let i = 0; i < propertyIndex; i++) {
                  const prevPropertyLanes = propertyReservationLanes[properties[i].id] || {};
                  const prevMaxLane = Object.values(prevPropertyLanes).reduce((max, lane) => Math.max(max, lane), 0);
                  const prevRowHeight = baseRowHeight + (prevMaxLane * laneHeight);
                  rowTopPosition += prevRowHeight;
                }
                
                return (
                  <React.Fragment key={property.id}>
                    {/* Property name (first column) */}
                    <div 
                      className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate"
                      style={{ height: `${rowHeight}px` }}
                    >
                      {property.name}
                    </div>
                    
                    {/* Calendar cells */}
                    {monthDays.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`border ${isToday ? 'bg-blue-50' : ''}`}
                          style={{ height: `${rowHeight}px` }}
                        />
                      );
                    })}

                    {/* Reservation bars */}
                    {propertyReservations.map((reservation) => {
                      // Get normalized dates
                      const startDate = reservation.startDate;
                      const endDate = reservation.endDate;
                      
                      // Check if reservation overlaps with current month view
                      if (endDate < monthStart || startDate > monthEnd) {
                        return null;
                      }
                      
                      // Calculate start and end positions
                      const visibleStartDate = startDate < monthStart ? monthStart : startDate;
                      const visibleEndDate = endDate > monthEnd ? monthEnd : endDate;
                      
                      // Find day index for start and end in the month days array
                      const startDayIndex = monthDays.findIndex(d => 
                        isSameDay(normalizeDate(d), visibleStartDate)
                      );
                      
                      let endDayIndex = monthDays.findIndex(d => 
                        isSameDay(normalizeDate(d), visibleEndDate)
                      );
                      
                      if (endDayIndex === -1) {
                        endDayIndex = monthDays.length - 1;
                      }
                      
                      // Calculate grid column positions with proper spacing
                      let startPosition = startDayIndex;
                      let endPosition = endDayIndex;
                      
                      // If this is the actual check-in day (not a continuation), start at 60% of cell
                      if (isSameDay(visibleStartDate, startDate)) {
                        startPosition += 0.6; // Start at 60% of the cell width
                      }
                      
                      // If this is the actual check-out day (not a continuation), end at 40% of cell
                      if (isSameDay(visibleEndDate, endDate)) {
                        endPosition += 0.4; // End at 40% of the cell width
                      } else {
                        // If not the actual check-out day, bar should extend to the end of the day
                        endPosition += 1;
                      }
                      
                      // Calculate left position and width using cell width
                      const left = `calc(200px + (${startPosition} * ${cellWidth}px))`;
                      const width = `calc(${(endPosition - startPosition)} * ${cellWidth}px)`;
                      
                      // Determine border radius style
                      const isStartTruncated = startDate < monthStart;
                      const isEndTruncated = endDate > monthEnd;
                      
                      let borderRadiusStyle = 'rounded-full';
                      if (isStartTruncated && isEndTruncated) {
                        borderRadiusStyle = 'rounded-none';
                      } else if (isStartTruncated) {
                        borderRadiusStyle = 'rounded-r-full rounded-l-none';
                      } else if (isEndTruncated) {
                        borderRadiusStyle = 'rounded-l-full rounded-r-none';
                      }
                      
                      // Get the lane assigned to this reservation
                      const lane = propertyLanes[reservation.id] || 0;
                      
                      // Calculate the vertical position within the property row
                      // Center the reservation bar vertically in the property row
                      const laneOffset = lane * laneHeight;
                      const verticalPosition = rowTopPosition + (rowHeight / 2) - 4 + laneOffset;
                      
                      // Determine text size based on bar width
                      const isShortReservation = endPosition - startPosition < 1;
                      
                      // Get style based on reservation type
                      const reservationClass = getReservationStyle(reservation);
                      
                      // Find source property name for blocks
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
