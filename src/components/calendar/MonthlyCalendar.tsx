import React, { useState, useMemo } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, eachWeekOfInterval, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reservation } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPlatformColorClass } from '@/data/mockData';
import { getReservationsForMonth, getReservationsForProperty } from '@/services/reservationService';
import { useQuery } from '@tanstack/react-query';

interface MonthlyCalendarProps {
  propertyId?: string;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ propertyId }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Use React Query to fetch reservations
  const { data: allReservations = [], isLoading } = useQuery({
    queryKey: ['reservations', currentMonth.getMonth() + 1, currentMonth.getFullYear(), propertyId],
    queryFn: async () => {
      if (propertyId) {
        const allReservations = await getReservationsForProperty(propertyId);
        return allReservations.filter(res => {
          const monthStart = startOfMonth(currentMonth);
          const monthEnd = endOfMonth(currentMonth);
          
          return (res.startDate <= monthEnd && res.endDate >= monthStart);
        });
      } else {
        return getReservationsForMonth(
          currentMonth.getMonth() + 1, 
          currentMonth.getFullYear()
        );
      }
    }
  });
  
  // Filter out reservations with "Blocked" in notes
  const reservations = allReservations.filter(res => res.notes !== 'Blocked');
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  
  // Create a 7x5 or 7x6 grid (depending on the month)
  const daysInGrid = [];
  const totalDaysInGrid = Math.ceil((monthDays.length + startDay) / 7) * 7;
  
  // Add empty cells for days before the start of the month
  for (let i = 0; i < startDay; i++) {
    daysInGrid.push(null);
  }
  
  // Add the days of the month
  daysInGrid.push(...monthDays);
  
  // Add empty cells for days after the end of the month
  const remainingCells = totalDaysInGrid - daysInGrid.length;
  for (let i = 0; i < remainingCells; i++) {
    daysInGrid.push(null);
  }
  
  // Helper to normalize date to noon UTC to avoid timezone issues
  const normalizeDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCHours(12, 0, 0, 0);
    return newDate;
  };

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < daysInGrid.length; i += 7) {
    weeks.push(daysInGrid.slice(i, i + 7));
  }

  // Calculate reservation lanes for each week with enhanced consecutive reservation handling
  const weekReservationLanes = useMemo(() => {
    const lanes: Record<number, Record<string, number>> = {};
    
    weeks.forEach((week, weekIndex) => {
      const weekLanes: Record<string, number> = {};
      
      // Filter reservations that overlap with this week
      let weekReservations = reservations.filter(reservation => {
        return week.some(day => {
          if (!day) return false;
          const normalizedDay = normalizeDate(day);
          return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
        });
      });
      
      // Sort reservations by start date to ensure consistent lane assignment
      const sortedReservations = [...weekReservations].sort(
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
            const prevLane = weekLanes[prevResId];
            
            // Check if this lane is available for the current reservation
            let canUseSameLane = true;
            
            // Check for conflicts with other reservations in this lane
            for (const existingResId in weekLanes) {
              if (existingResId === prevResId) continue;
              if (weekLanes[existingResId] !== prevLane) continue;
              
              const existingRes = weekReservations.find(r => r.id === existingResId);
              if (!existingRes) continue;
              
              // Check for date overlap
              if (reservation.startDate <= existingRes.endDate && 
                  reservation.endDate >= existingRes.startDate) {
                canUseSameLane = false;
                break;
              }
            }
            
            if (canUseSameLane) {
              weekLanes[resId] = prevLane;
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
          for (const existingResId in weekLanes) {
            const existingLane = weekLanes[existingResId];
            if (existingLane !== lane) continue;
            
            const existingRes = weekReservations.find(r => r.id === existingResId);
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
        weekLanes[resId] = lane;
      });
      
      lanes[weekIndex] = weekLanes;
    });
    
    return lanes;
  }, [weeks, reservations]);
  
  return (
    <div className="bg-white rounded-lg shadow w-full min-w-fit">
      <div className="flex items-center justify-between p-4 border-b">
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
        <div className="grid grid-cols-7 min-w-fit">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-2 font-medium text-gray-600 border-b min-w-[100px]">
              {day}
            </div>
          ))}
          
          {weeks.map((week, weekIndex) => {
            // Determine max lane for this week to calculate appropriate height
            const weekLanes = weekReservationLanes[weekIndex] || {};
            const maxLane = Object.values(weekLanes).reduce((max, lane) => Math.max(max, lane), 0);
            const laneHeight = 14; // Height for each reservation lane
            const minCellHeight = 100; // Minimum height for calendar cells
            const cellHeight = Math.max(minCellHeight, 80 + (maxLane * laneHeight));
            
            return (
              <React.Fragment key={`week-${weekIndex}`}>
                {week.map((day, dayIndex) => (
                  <div 
                    key={`day-${weekIndex}-${dayIndex}`} 
                    className={`calendar-day border relative ${day && !isSameMonth(day, currentMonth) ? 'bg-gray-50' : ''} min-w-[100px]`}
                    style={{ height: `${cellHeight}px` }}
                  >
                    {day && (
                      <>
                        <div className="text-sm font-medium p-1">
                          {format(day, 'd')}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Reservation bars */}
                <div className="col-span-7 relative h-0">
                  {week[0] && reservations.filter(reservation => {
                    return week.some(day => {
                      if (!day) return false;
                      const normalizedDay = normalizeDate(day);
                      return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
                    });
                  }).map((reservation) => {
                    // Work with normalized dates to avoid timezone issues
                    const startDate = reservation.startDate;
                    const endDate = reservation.endDate;
                    
                    // Find exact positions for this reservation in the current week
                    let startPos = -1;
                    let endPos = -1;
                    
                    // Find the exact position of the start and end days in this week
                    for (let i = 0; i < week.length; i++) {
                      const day = week[i];
                      if (!day) continue;
                      
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
                      // If we're at the last day of the week and haven't found endPos,
                      // but we know the reservation continues, set this as endPos
                      else if (i === week.length - 1 && endDate > normalizedDay && startPos !== -1) {
                        endPos = i;
                      }
                    }
                    
                    // If we didn't find a starting position in this week, don't render anything
                    if (startPos === -1) return null;
                    
                    // If we found a starting position but no ending, use the end of the week
                    if (endPos === -1 && startPos !== -1) {
                      endPos = 6; // Last day of week
                    }
                    
                    // Determine if the reservation continues from/to other weeks
                    const continuesFromPrevious = startPos === 0 && !isSameDay(normalizeDate(week[0]!), startDate);
                    const continuesToNext = endPos === 6 && !isSameDay(normalizeDate(week[6]!), endDate);
                    
                    // Calculate bar width and position with the new 40-20-40 spacing
                    let barStartPos = startPos;
                    let barEndPos = endPos;
                    
                    // If this is the actual check-in day, start at 60% of the cell
                    if (week[startPos] && isSameDay(normalizeDate(week[startPos]!), startDate)) {
                      barStartPos += 0.6; // Start at 60% of the cell width
                    }
                    
                    // If this is the actual check-out day, end at 40% of the cell
                    if (week[endPos] && isSameDay(normalizeDate(week[endPos]!), endDate)) {
                      barEndPos += 0.4; // End at 40% of the cell width
                    } else {
                      // If not the actual check-out day, bar should extend to the end of the day
                      barEndPos += 1;
                    }
                    
                    const barWidth = `${((barEndPos - barStartPos) / 7) * 100}%`;
                    const barLeft = `${(barStartPos / 7) * 100}%`;
                    
                    // Define border radius style based on if the reservation continues
                    let borderRadiusStyle = 'rounded-full';
                    if (continuesFromPrevious && continuesToNext) {
                      borderRadiusStyle = 'rounded-none';
                    } else if (continuesFromPrevious) {
                      borderRadiusStyle = 'rounded-r-full rounded-l-none';
                    } else if (continuesToNext) {
                      borderRadiusStyle = 'rounded-l-full rounded-r-none';
                    }
                    
                    // Get the lane assigned to this reservation for consistent vertical positioning
                    const weekLanes = weekReservationLanes[weekIndex] || {};
                    const lane = weekLanes[reservation.id] || 0;
                    
                    // Calculate consistent vertical position based on lane
                    const laneHeight = 14; // Height per lane
                    const baseOffset = -70; // Base offset from top
                    const verticalPosition = baseOffset - (lane * laneHeight);

                    // Determine text size based on bar width - smaller text for short reservations
                    const isShortReservation = barEndPos - barStartPos < 1;
                    
                    return (
                      <TooltipProvider key={`res-${weekIndex}-${reservation.id}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium ${isShortReservation ? 'text-xs' : 'text-sm'} z-10 transition-all hover:brightness-90 hover:shadow-md`}
                              style={{
                                top: `${verticalPosition}px`,
                                left: barLeft,
                                width: barWidth,
                                minWidth: '40px'
                              }}
                            >
                              {reservation.platform}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p><strong>Platform:</strong> {reservation.platform}</p>
                              <p><strong>Check-in:</strong> {format(startDate, 'MMM d, yyyy')}</p>
                              <p><strong>Check-out:</strong> {format(endDate, 'MMM d, yyyy')}</p>
                              {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
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
      )}
    </div>
  );
};

export default MonthlyCalendar;
