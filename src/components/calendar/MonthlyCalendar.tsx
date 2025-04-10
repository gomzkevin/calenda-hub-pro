
import React, { useState } from 'react';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReservationsForMonth, getPlatformColorClass } from '@/data/mockData';
import { Reservation } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      
      return (
        (day >= reservationStart && day <= reservationEnd) ||
        (format(day, 'yyyy-MM-dd') === format(reservationStart, 'yyyy-MM-dd')) ||
        (format(day, 'yyyy-MM-dd') === format(reservationEnd, 'yyyy-MM-dd'))
      );
    });
  };
  
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
          <div key={day} className="calendar-header">
            {day}
          </div>
        ))}
        
        {daysInGrid.map((day, index) => (
          <div 
            key={index} 
            className={`calendar-day ${day && !isSameMonth(day, currentMonth) ? 'bg-gray-50' : ''}`}
          >
            {day && (
              <>
                <div className="text-sm font-medium">
                  {format(day, 'd')}
                </div>
                <div className="mt-1">
                  {getReservationsForDay(day).map((reservation) => (
                    <TooltipProvider key={reservation.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`booking-event ${getPlatformColorClass(reservation.platform)}`}
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
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
