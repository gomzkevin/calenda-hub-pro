
import React, { useState } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reservation } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPlatformColorClass, getReservationsForMonth } from '@/data/mockData';

interface MonthlyCalendarProps {
  propertyId?: string;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ propertyId }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const reservations = getReservationsForMonth(
    currentMonth.getMonth() + 1, 
    currentMonth.getFullYear()
  );
  
  const filteredReservations = propertyId 
    ? reservations.filter(res => res.propertyId === propertyId)
    : reservations;
  
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
  
  // Get reservations for a specific day
  const getReservationsForDay = (day: Date): Reservation[] => {
    if (!day) return [];
    
    return filteredReservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      return isWithinInterval(day, { start: reservationStart, end: reservationEnd }) ||
        isSameDay(day, reservationStart) || 
        isSameDay(day, reservationEnd);
    });
  };

  // Check if a day is start of a reservation
  const isReservationStart = (day: Date, reservationId: string): boolean => {
    const reservation = filteredReservations.find(r => r.id === reservationId);
    if (!reservation) return false;
    
    const startDate = new Date(reservation.startDate);
    return isSameDay(day, startDate);
  };

  // Check if a day is end of a reservation
  const isReservationEnd = (day: Date, reservationId: string): boolean => {
    const reservation = filteredReservations.find(r => r.id === reservationId);
    if (!reservation) return false;
    
    const endDate = new Date(reservation.endDate);
    return isSameDay(day, endDate);
  };

  // Get reservations that start in a specific week
  const getReservationsForWeek = (weekDays: (Date | null)[]): Reservation[] => {
    const validDays = weekDays.filter(day => day !== null) as Date[];
    if (validDays.length === 0) return [];

    return filteredReservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);

      return validDays.some(day => {
        return day && (
          isSameDay(day, reservationStart) || 
          (day > reservationStart && day <= reservationEnd)
        );
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
                  
                  if (startPos === -1 && 
                      (isSameDay(currentDay, startDate) || currentDay > startDate)) {
                    startPos = i;
                  }
                  
                  if (isSameDay(currentDay, endDate)) {
                    endPos = i + 1;
                    break;
                  }
                }
                
                if (startPos === -1) startPos = 0;
                
                // Calculate width and position with half-day offsets
                // Add 0.5 to startPos if it's the start day, and subtract 0.5 from endPos if it's the end day
                const adjustedStartPos = isSameDay(week[startPos], startDate) ? startPos + 0.5 : startPos;
                const adjustedEndPos = (endPos < 7 && isSameDay(week[endPos-1], endDate)) ? endPos - 0.5 : endPos;
                
                const reservationWidth = `${((adjustedEndPos - adjustedStartPos) / 7) * 100}%`;
                const reservationLeft = `${(adjustedStartPos / 7) * 100}%`;
                
                // Skip if it doesn't fit in this week
                if (startPos >= 7 || endPos <= 0) return null;
                
                return (
                  <TooltipProvider key={`res-${weekIndex}-${resIndex}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} rounded-md flex items-center pl-2 text-white font-medium text-sm z-10`}
                          style={{
                            top: `${-84 + (resIndex * 10)}px`,
                            left: reservationLeft,
                            width: reservationWidth,
                            minWidth: '40px'
                          }}
                        >
                          {reservation.platform}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p><strong>Platform:</strong> {reservation.platform}</p>
                          <p><strong>Dates:</strong> {format(new Date(reservation.startDate), 'MMM d')} - {format(new Date(reservation.endDate), 'MMM d, yyyy')}</p>
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
    </div>
  );
};

export default MonthlyCalendar;
