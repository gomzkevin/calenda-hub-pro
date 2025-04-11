
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';

// Helper to normalize date to noon UTC to avoid timezone issues
const normalizeDate = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setUTCHours(12, 0, 0, 0);
  return newDate;
};

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [visibleStartIndex, setVisibleStartIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleDaysCount, setVisibleDaysCount] = useState<number>(14); // Default value
  
  // Fetch reservations
  const { data: allReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', 'multi', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getReservationsForMonth(
      currentMonth.getMonth() + 1, 
      currentMonth.getFullYear()
    )
  });
  
  // Filter reservations
  const reservations = allReservations.filter(res => {
    return res.notes !== 'Blocked' || res.sourceReservationId || res.isBlocking;
  });
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate how many days can be shown based on available width
  useEffect(() => {
    const calculateVisibleDays = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      // Reserve 160px for properties column
      const availableWidth = containerWidth - 160;
      
      // Calculate how many days fit (assuming 45px per column)
      const daysCount = Math.floor(availableWidth / 45);
      
      // Ensure a reasonable minimum
      setVisibleDaysCount(Math.max(7, daysCount));
      
      // Reset start index when month changes
      setVisibleStartIndex(0);
    };
    
    calculateVisibleDays();
    
    // Recalculate when window size changes
    window.addEventListener('resize', calculateVisibleDays);
    return () => window.removeEventListener('resize', calculateVisibleDays);
  }, [currentMonth]);
  
  // Visible days window
  const visibleDays = useMemo(() => {
    return monthDays.slice(visibleStartIndex, visibleStartIndex + visibleDaysCount);
  }, [monthDays, visibleStartIndex, visibleDaysCount]);
  
  // Determine if there are more days to show
  const hasMoreDaysForward = visibleStartIndex + visibleDaysCount < monthDays.length;
  const hasMoreDaysBackward = visibleStartIndex > 0;
  
  // Navigate between days
  const showNextDays = () => {
    if (hasMoreDaysForward) {
      setVisibleStartIndex(Math.min(
        visibleStartIndex + Math.floor(visibleDaysCount / 2), // Move by half the visible days
        monthDays.length - visibleDaysCount
      ));
    }
  };
  
  const showPreviousDays = () => {
    if (hasMoreDaysBackward) {
      setVisibleStartIndex(Math.max(
        visibleStartIndex - Math.floor(visibleDaysCount / 2), // Move by half the visible days
        0
      ));
    }
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  // Get reservations for a specific property
  const getReservationsForProperty = (propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  };
  
  // Get reservation style based on type
  const getReservationStyle = (reservation: Reservation): string => {
    // If it's a block from a related property
    if (reservation.notes === 'Blocked' && reservation.sourceReservationId) {
      return 'bg-gray-400 opacity-70 border border-dashed border-white';
    }
    
    // Normal reservation
    return getPlatformColorClass(reservation.platform);
  };
  
  // Calculate lanes for each property
  const propertyLanes = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    properties.forEach(property => {
      const propertyReservations = getReservationsForProperty(property.id);
      
      // Sort reservations by start date
      const sortedReservations = [...propertyReservations].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      
      // Track lane assignments for this property
      const lanes: Record<string, number> = {};
      
      sortedReservations.forEach((reservation, index) => {
        // Try to use the same lane as previous reservation if they're consecutive
        if (index > 0) {
          const prevReservation = sortedReservations[index-1];
          const daysBetween = Math.abs(
            (reservation.startDate.getTime() - prevReservation.endDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween <= 1) {
            const prevLane = lanes[prevReservation.id];
            let canUseSameLane = true;
            
            // Check for conflicts
            for (const resId in lanes) {
              if (resId === prevReservation.id) continue;
              if (lanes[resId] !== prevLane) continue;
              
              const existingRes = propertyReservations.find(r => r.id === resId);
              if (!existingRes) continue;
              
              if (reservation.startDate <= existingRes.endDate && 
                  reservation.endDate >= existingRes.startDate) {
                canUseSameLane = false;
                break;
              }
            }
            
            if (canUseSameLane) {
              lanes[reservation.id] = prevLane;
              return;
            }
          }
        }
        
        // Find the first available lane
        let lane = 0;
        let laneFound = false;
        
        while (!laneFound) {
          laneFound = true;
          
          // Check for conflicts
          for (const resId in lanes) {
            if (lanes[resId] !== lane) continue;
            
            const existingRes = propertyReservations.find(r => r.id === resId);
            if (!existingRes) continue;
            
            if (reservation.startDate <= existingRes.endDate && 
                reservation.endDate >= existingRes.startDate) {
              laneFound = false;
              break;
            }
          }
          
          if (!laneFound) lane++;
        }
        
        lanes[reservation.id] = lane;
      });
      
      result[property.id] = lanes;
    });
    
    return result;
  }, [properties, reservations]);
  
  // Calculate row heights based on lanes
  const propertyRowHeights = useMemo(() => {
    const heights: Record<string, number> = {};
    const laneHeight = 14;
    const baseHeight = 48;
    
    properties.forEach(property => {
      const lanes = propertyLanes[property.id] || {};
      const maxLane = Object.values(lanes).reduce((max, lane) => Math.max(max, lane), 0);
      heights[property.id] = Math.max(baseHeight, (maxLane + 1) * laneHeight + 16);
    });
    
    return heights;
  }, [properties, propertyLanes]);
  
  const isLoading = isLoadingReservations || isLoadingProperties;
  
  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full" ref={containerRef}>
      {/* Header with navigation controls */}
      <div className="sticky top-0 left-0 z-30 bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex space-x-2">
            {/* Month navigation */}
            <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Day window navigation */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={showPreviousDays}
              disabled={!hasMoreDaysBackward}
              className="ml-2"
              aria-label="Previous days"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={showNextDays}
              disabled={!hasMoreDaysForward}
              aria-label="Next days"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Month navigation */}
            <Button variant="outline" size="icon" onClick={nextMonth} className="ml-2" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="text-xs text-center text-gray-500">
          Showing days {visibleStartIndex + 1} - {Math.min(visibleStartIndex + visibleDaysCount, monthDays.length)} of {monthDays.length}
        </div>
      </div>
      
      {/* Calendar content */}
      {isLoading ? (
        <div className="flex justify-center items-center p-12 flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          <table className="min-w-full border-collapse table-fixed">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                {/* Properties column header */}
                <th className="w-40 px-2 py-2 text-left font-medium text-sm text-gray-600 border-b border-r sticky left-0 bg-white z-20">
                  Properties
                </th>
                
                {/* Day headers */}
                {visibleDays.map((day, index) => (
                  <th 
                    key={`header-${index}`} 
                    className={`w-12 px-0 py-2 text-center font-medium text-xs text-gray-600 border-b ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div>{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                const propertyReservations = getReservationsForProperty(property.id);
                const propertyLanesMap = propertyLanes[property.id] || {};
                const rowHeight = propertyRowHeights[property.id] || 48;
                
                return (
                  <tr key={`property-${property.id}`} style={{ height: `${rowHeight}px` }}>
                    {/* Property name cell */}
                    <td className="px-2 py-2 text-sm font-medium border-b border-r sticky left-0 bg-white z-10">
                      {property.name}
                    </td>
                    
                    {/* Day cells */}
                    {visibleDays.map((day, dayIndex) => (
                      <td 
                        key={`cell-${property.id}-${dayIndex}`} 
                        className={`relative border-b ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
                      >
                        {/* Cell content */}
                      </td>
                    ))}
                    
                    {/* Reservation bars */}
                    {propertyReservations
                      .filter(reservation => {
                        // Only show reservations that overlap with visible days
                        const startDate = reservation.startDate;
                        const endDate = reservation.endDate;
                        return endDate >= visibleDays[0] && startDate <= visibleDays[visibleDays.length - 1];
                      })
                      .map((reservation) => {
                        // Calculating positions
                        const startDate = reservation.startDate;
                        const endDate = reservation.endDate;
                        
                        // Find visible start/end days
                        const visibleStartDate = startDate < visibleDays[0] ? visibleDays[0] : startDate;
                        const visibleEndDate = endDate > visibleDays[visibleDays.length - 1] ? 
                          visibleDays[visibleDays.length - 1] : endDate;
                        
                        // Find day indices in visible days array
                        const startDayIndex = visibleDays.findIndex(d => 
                          isSameDay(normalizeDate(d), visibleStartDate)
                        );
                        
                        let endDayIndex = visibleDays.findIndex(d => 
                          isSameDay(normalizeDate(d), visibleEndDate)
                        );
                        
                        if (endDayIndex === -1) {
                          endDayIndex = visibleDays.length - 1;
                        }
                        
                        // Cell dimensions
                        const cellWidth = 48; // Approximate width of each cell
                        
                        // Calculate position with 60/40 spacing
                        let leftOffset = (startDayIndex * cellWidth) + 40; // 40px for property column
                        let width = ((endDayIndex - startDayIndex) + 1) * cellWidth;
                        
                        // Adjust for check-in (starting at 60% of cell)
                        if (isSameDay(visibleStartDate, startDate)) {
                          leftOffset += cellWidth * 0.6;
                          width -= cellWidth * 0.6;
                        }
                        
                        // Adjust for check-out (ending at 40% of cell)
                        if (isSameDay(visibleEndDate, endDate)) {
                          width -= cellWidth * 0.6;
                        }
                        
                        // Border styles
                        const isStartTruncated = startDate < visibleDays[0];
                        const isEndTruncated = endDate > visibleDays[visibleDays.length - 1];
                        
                        let borderRadiusStyle = 'rounded-full';
                        if (isStartTruncated && isEndTruncated) {
                          borderRadiusStyle = 'rounded-none';
                        } else if (isStartTruncated) {
                          borderRadiusStyle = 'rounded-r-full rounded-l-none';
                        } else if (isEndTruncated) {
                          borderRadiusStyle = 'rounded-l-full rounded-r-none';
                        }
                        
                        // Get lane and calculate vertical position
                        const lane = propertyLanesMap[reservation.id] || 0;
                        const laneHeight = 14;
                        const verticalOffset = 10 + (lane * laneHeight);
                        
                        // Style based on reservation type
                        const reservationClass = getReservationStyle(reservation);
                        
                        // Calculate if the reservation is short
                        const isShortReservation = endDayIndex - startDayIndex < 1;
                        
                        return (
                          <div 
                            key={`res-${property.id}-${reservation.id}`}
                            className={`absolute h-8 ${reservationClass} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium ${isShortReservation ? 'text-xs' : 'text-sm'} z-10 transition-all hover:brightness-90 hover:shadow-md`}
                            style={{
                              top: `${verticalOffset}px`,
                              left: `${leftOffset}px`,
                              width: `${Math.max(40, width)}px`, // Ensure minimum width
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="w-full h-full flex items-center">
                                  {isShortReservation ? reservation.platform.charAt(0) : reservation.platform}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p><strong>{property.name}</strong></p>
                                    <p><strong>Platform:</strong> {reservation.platform}</p>
                                    <p><strong>Check-in:</strong> {format(startDate, 'MMM d, yyyy')}</p>
                                    <p><strong>Check-out:</strong> {format(endDate, 'MMM d, yyyy')}</p>
                                    {reservation.notes && reservation.notes !== 'Blocked' && (
                                      <p><strong>Notes:</strong> {reservation.notes}</p>
                                    )}
                                    {reservation.notes === 'Blocked' && reservation.sourceReservationId && (
                                      <p className="italic text-gray-500">Blocked by another reservation</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;
