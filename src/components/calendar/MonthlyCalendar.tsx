
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
  
  // Get reservations for a day
  const getReservationsForDay = (day: Date): Reservation[] => {
    if (!day) return [];
    
    return reservations.filter(reservation => {
      const reservationStart = reservation.startDate;
      const reservationEnd = reservation.endDate;
      
      return isWithinInterval(day, { start: reservationStart, end: reservationEnd }) ||
        isSameDay(day, reservationStart) || 
        isSameDay(day, reservationEnd);
    });
  };

  // Get reservations that overlap with a specific week
  const getReservationsForWeek = (weekDays: (Date | null)[]): Reservation[] => {
    const validDays = weekDays.filter(day => day !== null) as Date[];
    if (validDays.length === 0) return [];

    return reservations.filter(reservation => {
      return validDays.some(day => {
        if (!day) return false;
        // Normalize both dates for comparison
        const normalizedDay = normalizeDate(day);
        return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
      });
    });
  };

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
                  // Trabajamos con las fechas normalizadas para evitar problemas de zona horaria
                  const startDate = reservation.startDate;
                  const endDate = reservation.endDate;
                  
                  // Determinamos cómo se posiciona esta reserva en la semana actual
                  let startPos = -1;
                  let endPos = -1;
                  
                  // Buscamos la posición exacta del día de inicio y fin en esta semana
                  for (let i = 0; i < week.length; i++) {
                    const day = week[i];
                    if (!day) continue;
                    
                    const normalizedDay = normalizeDate(day);
                    
                    // Si este día es exactamente el día de inicio o está después del inicio
                    // y aún no hemos establecido startPos, lo establecemos ahora
                    if (startPos === -1) {
                      if (isSameDay(normalizedDay, startDate)) {
                        startPos = i;
                      } else if (normalizedDay > startDate) {
                        startPos = i;
                      }
                    }
                    
                    // Si este día es exactamente el día de fin, establecemos endPos y terminamos
                    if (isSameDay(normalizedDay, endDate)) {
                      endPos = i;
                      break;
                    }
                    // Si estamos procesando el último día de la semana y aún no hemos encontrado endPos,
                    // pero sabemos que la reserva continúa, establecemos este día como endPos
                    else if (i === week.length - 1 && endDate > normalizedDay && startPos !== -1) {
                      endPos = i;
                    }
                  }
                  
                  // Si no encontramos una posición de inicio en esta semana, no renderizamos nada
                  if (startPos === -1) return null;
                  
                  // Si no encontramos una posición de fin pero tenemos un inicio, usamos el final de la semana
                  if (endPos === -1 && startPos !== -1) {
                    endPos = 6; // Último día de la semana
                  }
                  
                  // Determinamos si la reserva continúa desde/hacia otras semanas
                  const continuesFromPrevious = startPos === 0 && !isSameDay(normalizeDate(week[0]!), startDate);
                  const continuesToNext = endPos === 6 && !isSameDay(normalizeDate(week[6]!), endDate);
                  
                  // Calculamos el ancho y posición de la barra
                  let barStartPos = startPos;
                  let barEndPos = endPos;
                  
                  // Si este es el día de check-in real, comenzamos desde la mitad del día
                  if (week[startPos] && isSameDay(normalizeDate(week[startPos]!), startDate)) {
                    barStartPos += 0.5;
                  }
                  
                  // Si este es el día de check-out real, terminamos en la mitad del día
                  if (week[endPos] && isSameDay(normalizeDate(week[endPos]!), endDate)) {
                    barEndPos += 0.5;
                  } else {
                    // Si no es el día de check-out real, la barra debe extenderse hasta el final del día
                    barEndPos += 1;
                  }
                  
                  const barWidth = `${((barEndPos - barStartPos) / 7) * 100}%`;
                  const barLeft = `${(barStartPos / 7) * 100}%`;
                  
                  // Definimos el estilo de borde redondeado basado en si la reserva continúa
                  let borderRadiusStyle = 'rounded-full';
                  if (continuesFromPrevious && continuesToNext) {
                    borderRadiusStyle = 'rounded-none';
                  } else if (continuesFromPrevious) {
                    borderRadiusStyle = 'rounded-r-full rounded-l-none';
                  } else if (continuesToNext) {
                    borderRadiusStyle = 'rounded-l-full rounded-r-none';
                  }
                  
                  // Calculamos la posición vertical para evitar superposiciones
                  // Usamos una separación constante entre barras para mantenerlas bien alineadas
                  const verticalPosition = -84 + (resIndex * 12);
                  
                  return (
                    <TooltipProvider key={`res-${weekIndex}-${resIndex}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`absolute h-8 ${getPlatformColorClass(reservation.platform)} ${borderRadiusStyle} flex items-center pl-2 text-white font-medium text-sm z-10 transition-all hover:brightness-90 hover:shadow-md`}
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
                            <p><strong>Check-in:</strong> {format(startDate, 'MMM d')}</p>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendar;
