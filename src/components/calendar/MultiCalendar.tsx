
import React, { useState, useMemo } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformColorClass } from '@/data/mockData';
import { Reservation, Property } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
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
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Helper to normalize date to noon UTC to avoid timezone issues
  const normalizeDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCHours(12, 0, 0, 0);
    return newDate;
  };
  
  // Get reservations for a specific property
  const getReservationsForProperty = (propertyId: string): Reservation[] => {
    return reservations.filter(res => res.propertyId === propertyId);
  };
  
  const isLoading = isLoadingReservations || isLoadingProperties;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-auto">
      <div className="sticky top-0 left-0 z-30 bg-white border-b flex items-center justify-between p-4">
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
        <div className="relative min-w-full overflow-x-auto">
          <div className="grid grid-cols-[160px_repeat(auto-fill,minmax(45px,1fr))]">
            {/* Header row - Property name column */}
            <div className="sticky top-0 left-0 z-20 bg-white border-b border-r h-10 flex items-center justify-center font-medium">
              Properties
            </div>
            
            {/* Header row - Day columns */}
            {monthDays.map((day, index) => (
              <div 
                key={`day-header-${index}`}
                className="sticky top-0 z-10 bg-white border-b h-10 flex flex-col items-center justify-center font-medium text-xs"
              >
                <span>{format(day, 'EEE')}</span>
                <span>{format(day, 'd')}</span>
              </div>
            ))}
            
            {/* Property rows with reservations */}
            {properties.map(property => {
              const propertyReservations = getReservationsForProperty(property.id);
              
              // Calculate lanes for this property
              const lanes = useMemo(() => {
                const laneAssignments = {};
                const sortedReservations = [...propertyReservations].sort(
                  (a, b) => a.startDate.getTime() - b.startDate.getTime()
                );
                
                sortedReservations.forEach(reservation => {
                  // Find first available lane that doesn't overlap
                  let lane = 0;
                  let laneFound = false;
                  
                  while (!laneFound) {
                    laneFound = true;
                    
                    // Check if any reservation in this lane overlaps
                    for (const resId in laneAssignments) {
                      if (laneAssignments[resId] !== lane) continue;
                      
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
                  
                  laneAssignments[reservation.id] = lane;
                });
                
                return laneAssignments;
              }, [propertyReservations]);
              
              // Calculate height for this property row based on number of lanes
              const maxLane = Object.values(lanes).reduce((max, lane: any) => Math.max(max, lane), 0);
              const laneHeight = 14;
              const baseHeight = 48;
              const rowHeight = Math.max(baseHeight, (maxLane + 1) * laneHeight + 16);
              
              return (
                <React.Fragment key={`property-${property.id}`}>
                  {/* Property name column */}
                  <div 
                    className="sticky left-0 z-10 bg-white border-b border-r p-2 font-medium truncate"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {property.name}
                  </div>
                  
                  {/* Day cells for this property */}
                  {monthDays.map((day, dayIndex) => (
                    <div
                      key={`cell-${property.id}-${dayIndex}`}
                      className={`border ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''} relative`}
                      style={{ height: `${rowHeight}px` }}
                    >
                      {/* Reservations that start on this day */}
                      {propertyReservations
                        .filter(res => {
                          // Show reservations that include this day
                          const normalizedDay = normalizeDate(day);
                          return normalizedDay <= res.endDate && normalizedDay >= res.startDate;
                        })
                        .map(reservation => {
                          // Only render the reservation in its starting column
                          const startDay = monthDays.findIndex(d => 
                            isSameDay(normalizeDate(d), reservation.startDate)
                          );
                          
                          if (startDay !== dayIndex) return null;
                          
                          // Calculate end position
                          const endDay = monthDays.findIndex(d => 
                            isSameDay(normalizeDate(d), reservation.endDate)
                          );
                          
                          const finalEndDay = endDay === -1 ? monthDays.length - 1 : endDay;
                          
                          // Calculate spans and positions
                          const spanDays = finalEndDay - startDay + 1;
                          const isStartTruncated = reservation.startDate < monthStart;
                          const isEndTruncated = reservation.endDate > monthEnd;
                          
                          // Determine border radius
                          let borderRadiusStyle = 'rounded-full';
                          if (isStartTruncated && isEndTruncated) {
                            borderRadiusStyle = 'rounded-none';
                          } else if (isStartTruncated) {
                            borderRadiusStyle = 'rounded-r-full rounded-l-none';
                          } else if (isEndTruncated) {
                            borderRadiusStyle = 'rounded-l-full rounded-r-none';
                          }
                          
                          // Get the lane
                          const lane = lanes[reservation.id] || 0;
                          
                          // Get reservation style
                          const reservationClass = getPlatformColorClass(reservation.platform);
                          
                          return (
                            <div 
                              key={`res-${property.id}-${reservation.id}`}
                              className={`absolute h-8 ${reservationClass} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium z-10 transition-all hover:brightness-90 hover:shadow-md`}
                              style={{
                                top: `${8 + (lane * laneHeight)}px`,
                                left: isSameDay(day, reservation.startDate) ? '60%' : '0',
                                width: `calc(${spanDays}00% - ${isSameDay(day, reservation.startDate) ? '60%' : '0'} - ${isSameDay(monthDays[finalEndDay], reservation.endDate) ? '60%' : '0'})`,
                                right: isSameDay(monthDays[finalEndDay], reservation.endDate) ? '60%' : '0',
                              }}
                            >
                              {reservation.platform}
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCalendar;