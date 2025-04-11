
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns';
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

// Helper function to get reservations for a specific property
const getReservationsForProperty = (reservations: Reservation[], propertyId: string): Reservation[] => {
  return reservations.filter(res => res.propertyId === propertyId);
};

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

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const isMobile = useIsMobile();
  
  // Define fixed dimensions - no dynamic calculations
  const CELL_WIDTH = isMobile ? 40 : 50;
  const PROPERTY_COLUMN_WIDTH = 160;
  const VISIBLE_DAYS = isMobile ? 10 : 20;
  const ROW_BASE_HEIGHT = 48;
  const LANE_HEIGHT = 12;
  const HEADER_HEIGHT = 10;
  
  // Use refs to store row heights and positions
  const rowHeightsRef = useRef<Record<string, number>>({});
  const rowPositionsRef = useRef<Record<string, number>>({});
  
  // Container ref for measuring
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch reservations
  const { data: allReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', 'multi', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getReservationsForMonth(
      currentMonth.getMonth() + 1, 
      currentMonth.getFullYear()
    )
  });
  
  // Only filter out reservations with specifically "Blocked" in notes that are not relationship-based blocks
  const reservations = useMemo(() => {
    return allReservations.filter(res => {
      // Show if not blocked or if it's a relationship-based block
      return res.notes !== 'Blocked' || res.sourceReservationId || res.isBlocking;
    });
  }, [allReservations]);
  
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
  
  // Limit visible days - fixed amount
  const visibleMonthDays = useMemo(() => {
    return monthDays.slice(0, VISIBLE_DAYS);
  }, [monthDays]);
  
  // Compute reservation lanes for each property - only when data changes
  const propertyReservationLanes = useMemo(() => {
    const lanes: Record<string, Record<string, number>> = {};
    
    properties.forEach(property => {
      const propertyId = property.id;
      const propertyReservations = getReservationsForProperty(reservations, propertyId);
      
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

  // Calculate row heights and positions - only when dependencies change
  useEffect(() => {
    if (isLoadingProperties || isLoadingReservations || !properties.length) return;
    
    const newRowHeights: Record<string, number> = {};
    const newRowPositions: Record<string, number> = {};
    
    let currentPosition = HEADER_HEIGHT;
    
    properties.forEach((property) => {
      // Calculate max lanes for this property
      const propertyLanes = propertyReservationLanes[property.id] || {};
      const maxLane = Object.values(propertyLanes).reduce((max, lane) => 
        Math.max(max, lane as number), 0);
      
      // Calculate appropriate row height based on number of lanes
      const rowHeight = ROW_BASE_HEIGHT + (maxLane * LANE_HEIGHT);
      
      newRowHeights[property.id] = rowHeight;
      newRowPositions[property.id] = currentPosition;
      
      currentPosition += rowHeight;
    });
    
    // Update refs without triggering re-renders
    rowHeightsRef.current = newRowHeights;
    rowPositionsRef.current = newRowPositions;
  }, [properties, reservations, propertyReservationLanes, isLoadingProperties, isLoadingReservations]);

  const isLoading = isLoadingReservations || isLoadingProperties;

  // Calculate fixed total width to avoid overflow issues
  const totalWidth = PROPERTY_COLUMN_WIDTH + (VISIBLE_DAYS * CELL_WIDTH);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-4">
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
        <ScrollArea className="flex-1 w-full overflow-hidden border rounded-md">
          <div 
            ref={containerRef}
            className="relative" 
            style={{
              width: `${totalWidth}px`,
              minWidth: `${totalWidth}px`
            }}
          >
            <div className="grid" style={{ 
              gridTemplateColumns: `${PROPERTY_COLUMN_WIDTH}px repeat(${visibleMonthDays.length}, ${CELL_WIDTH}px)`,
            }}>
              {/* Header row with dates */}
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
              
              {/* Property rows */}
              {properties.map((property: Property) => {
                const propertyReservations = getReservationsForProperty(reservations, property.id);
                const propertyLanes = propertyReservationLanes[property.id] || {};
                
                // Access height and position from refs to prevent render loops
                const rowHeight = rowHeightsRef.current[property.id] || ROW_BASE_HEIGHT;
                
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

                    {/* Reservation bars */}
                    {propertyReservations.map((reservation) => {
                      // Get normalized dates
                      const startDate = reservation.startDate;
                      const endDate = reservation.endDate;
                      
                      // Check if reservation overlaps with visible days
                      if (endDate < visibleMonthDays[0] || startDate > visibleMonthDays[visibleMonthDays.length - 1]) {
                        return null;
                      }
                      
                      // Calculate start and end positions
                      const visibleStartDate = startDate < visibleMonthDays[0] ? visibleMonthDays[0] : startDate;
                      const visibleEndDate = endDate > visibleMonthDays[visibleMonthDays.length - 1] ? 
                        visibleMonthDays[visibleMonthDays.length - 1] : endDate;
                      
                      // Find day index for start and end in the visible days array
                      const startDayIndex = visibleMonthDays.findIndex(d => 
                        isSameDay(normalizeDate(d), visibleStartDate)
                      );
                      
                      let endDayIndex = visibleMonthDays.findIndex(d => 
                        isSameDay(normalizeDate(d), visibleEndDate)
                      );
                      
                      if (endDayIndex === -1) {
                        endDayIndex = visibleMonthDays.length - 1;
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
                      
                      // Calculate left position and width using cell width - fixed dimensions
                      const left = `${PROPERTY_COLUMN_WIDTH + (startPosition * CELL_WIDTH)}px`;
                      const width = `${(endPosition - startPosition) * CELL_WIDTH}px`;
                      
                      // Determine border radius style
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
                      
                      // Get the lane assigned to this reservation
                      const lane = propertyLanes[reservation.id] || 0;
                      
                      // Use ref for row position
                      const rowPosition = rowPositionsRef.current[property.id] || 0;
                      
                      // Calculate the vertical position using values from refs
                      const laneOffset = lane * LANE_HEIGHT; 
                      // Center the reservation bar vertically in the property row
                      const verticalPosition = rowPosition + (rowHeight / 2) - 4 + laneOffset;
                      
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
                      
                      // Only render reservation if it's within the visible range
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
        </ScrollArea>
      )}
    </div>
  );
};

export default MultiCalendar;
