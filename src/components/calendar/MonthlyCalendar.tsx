
import React, { useState } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval } from 'date-fns';
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
          const resStartDate = new Date(res.startDate);
          const resEndDate = new Date(res.endDate);
          const monthStart = startOfMonth(currentMonth);
          const monthEnd = endOfMonth(currentMonth);
          
          return (resStartDate <= monthEnd && resEndDate >= monthStart);
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
  
  // Get reservations for a day
  const getReservationsForDay = (day: Date): Reservation[] => {
    if (!day) return [];
    
    return reservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      return isWithinInterval(day, { start: reservationStart, end: reservationEnd }) ||
        isSameDay(day, reservationStart) || 
        isSameDay(day, reservationEnd);
    });
  };

  // Check if a day is start of a reservation
  const isReservationStart = (day: Date, reservationId: string): boolean => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return false;
    
    const startDate = new Date(reservation.startDate);
    return isSameDay(day, startDate);
  };

  // Check if a day is end of a reservation
  const isReservationEnd = (day: Date, reservationId: string): boolean => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return false;
    
    const endDate = new Date(reservation.endDate);
    return isSameDay(day, endDate);
  };

  // Get reservations that start in a specific week
  const getReservationsForWeek = (weekDays: (Date | null)[]): Reservation[] => {
    const validDays = weekDays.filter(day => day !== null) as Date[];
    if (validDays.length === 0) return [];

    return reservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);

      return validDays.some(day => {
        if (!day) return false;
        return day <= reservationEnd && day >= reservationStart;
      });
    });
  };

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < daysInGrid.length; i += 7) {
    weeks.push(daysInGrid.slice(i, i + 7));
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
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
        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-2 font-medium text-gray-600 border-b">
              {day}
            </div>
          ))}
          
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={`week-${weekIndex}`}>
              {week.map((day, dayIndex) => (
                <div 
                  key={`day-${weekIndex}-${dayIndex}`} 
                  className={`calendar-day min-h-[100px] border relative ${day && !isSameMonth(day, currentMonth) ? 'bg-gray-50' : ''}`}
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
                {week[0] && getReservationsForWeek(week).map((reservation, resIndex) => {
                  const startDate = new Date(reservation.startDate);
                  const endDate = new Date(reservation.endDate);
                  
                  // Find position of start and end days in this week
                  let startPos = -1;
                  let endPos = 7;
                  
                  for (let i = 0; i < week.length; i++) {
                    const currentDay = week[i];
                    if (!currentDay) continue;
                    
                    // Check if current day is the start date
                    if (startPos === -1 && isSameDay(currentDay, startDate)) {
                      startPos = i;
                    } else if (startPos === -1 && currentDay > startDate) {
                      // If we're past the start date but haven't set it yet, set it to this cell
                      startPos = i;
                    }
                    
                    // Check if current day is the end date
                    if (isSameDay(currentDay, endDate)) {
                      endPos = i;
                      break;
                    }
                  }
                  
                  // Handle cases where the reservation doesn't start or end in this week
                  if (startPos === -1) startPos = 0;
                  if (endPos === 7 && startPos !== -1) endPos = 6;
                  
                  // Check if the reservation continues to the next or from the previous week
                  const continuesFromPrevious = startPos === 0 && !isSameDay(week[0], startDate);
                  const continuesToNext = endPos === 6 && !isSameDay(week[6], endDate);
                  
                  // Calculate start/end adjustments
                  // For check-in day (start): Add 0.5 to start from middle of cell
                  // For check-out day (end): Add 0.5 to end at middle of cell
                  let adjustedStartPos = startPos;
                  let adjustedEndPos = endPos + 1; // +1 because endPos is inclusive
                  
                  // Only adjust for actual check-in/out, not for week continuations
                  if (isSameDay(week[startPos], startDate)) {
                    adjustedStartPos += 0.5; // Start from middle of check-in cell
                  }
                  
                  if (isSameDay(week[endPos], endDate)) {
                    adjustedEndPos = endPos + 0.5; // End at middle of check-out cell
                  }
                  
                  const barWidth = `${((adjustedEndPos - adjustedStartPos) / 7) * 100}%`;
                  const barLeft = `${(adjustedStartPos / 7) * 100}%`;
                  
                  // Set border radius based on continuation
                  let borderRadiusStyle = 'rounded-full';
                  if (continuesFromPrevious && continuesToNext) {
                    borderRadiusStyle = 'rounded-none'; // No rounded corners on both sides
                  } else if (continuesFromPrevious) {
                    borderRadiusStyle = 'rounded-r-full rounded-l-none'; // Rounded right corner only
                  } else if (continuesToNext) {
                    borderRadiusStyle = 'rounded-l-full rounded-r-none'; // Rounded left corner only
                  }
                  
                  // Skip if it doesn't fit in this week
                  if (startPos > 6 || endPos < 0) return null;
                  
                  return (
                    <TooltipProvider key={`res-${weekIndex}-${resIndex}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium text-sm z-10 transition-all hover:brightness-90 hover:shadow-md`}
                            style={{
                              top: `${-84 + (resIndex * 10)}px`,
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
                            <p><strong>Check-in:</strong> {format(new Date(reservation.startDate), 'MMM d')}</p>
                            <p><strong>Check-out:</strong> {format(new Date(reservation.endDate), 'MMM d, yyyy')}</p>
                            {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendar;
