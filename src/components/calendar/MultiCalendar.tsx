import React, { useState, useMemo } from 'react';
import { 
  addMonths, format, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, differenceInDays 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getReservationsForMonth } from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Reservation } from '@/types';

// Get platform color class
const getPlatformClass = (platform: string) => {
  const platformClasses: Record<string, string> = {
    'Airbnb': 'bg-red-500/70',
    'Booking': 'bg-blue-600/70',
    'Vrbo': 'bg-green-600/70',
    'Manual': 'bg-purple-600/70',
    'Other': 'bg-gray-600/70'
  };
  
  return platformClasses[platform] || 'bg-gray-600/70';
};

// Simple component for a day header cell
const DayHeaderCell = ({ day, isToday }: { day: Date, isToday: boolean }) => (
  <div className={`text-center p-1 border-b border-r min-w-[40px] text-xs font-medium ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
    <div className="mb-1">{format(day, 'EEE')}</div>
    <div>{format(day, 'd')}</div>
  </div>
);

// Property row component
const PropertyRow = ({ 
  property, 
  days, 
  reservations 
}: { 
  property: any, 
  days: Date[], 
  reservations: Reservation[] 
}) => {
  const propertyReservations = reservations.filter(res => res.propertyId === property.id);
  
  return (
    <div className="flex border-b">
      {/* Property name cell */}
      <div className="sticky left-0 z-10 bg-white border-r p-2 font-medium w-[160px] shrink-0 flex items-center">
        <div className="truncate">{property.name}</div>
      </div>
      
      {/* Days cells */}
      {days.map((day, index) => {
        const isToday = isSameDay(day, new Date());
        const dayReservations = propertyReservations.filter(
          res => day >= res.startDate && day < res.endDate
        );
        
        return (
          <div 
            key={index} 
            className={`flex-1 min-w-[40px] border-r p-1 ${isToday ? 'bg-blue-50' : ''}`}
          >
            {dayReservations.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`
                        ${getPlatformClass(dayReservations[0].platform)} 
                        text-white text-xs rounded-sm p-1 truncate cursor-pointer
                      `}
                    >
                      {dayReservations[0].platform}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      {dayReservations.map(res => (
                        <div key={res.id}>
                          <p><strong>{format(res.startDate, 'MMM d')} - {format(res.endDate, 'MMM d')}</strong></p>
                          <p>Platform: {res.platform}</p>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Reservation overlay component
const ReservationOverlay = ({
  reservations,
  properties,
  days
}: {
  reservations: Reservation[],
  properties: any[],
  days: Date[]
}) => {
  // Filter out reservations that don't overlap with visible days
  const visibleReservations = useMemo(() => {
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    return reservations.filter(res => {
      const startDate = res.startDate;
      const endDate = res.endDate;
      return !(endDate < firstDay || startDate > lastDay);
    });
  }, [reservations, days]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div className="relative w-full h-full">
        {visibleReservations.map(reservation => {
          const property = properties.find(p => p.propertyId === reservation.propertyId);
          const propertyIndex = properties.findIndex(p => p.id === reservation.propertyId);
          
          if (propertyIndex === -1) return null;
          
          // Calculate position
          const startDate = reservation.startDate;
          const endDate = reservation.endDate;
          
          // Find visible start and end dates
          const visibleStartDate = startDate < days[0] ? days[0] : startDate;
          const visibleEndDate = endDate > days[days.length - 1] ? days[days.length - 1] : endDate;
          
          // Find day indices for positioning
          const startIdx = days.findIndex(day => isSameDay(day, visibleStartDate));
          const endIdx = days.findIndex(day => isSameDay(day, visibleEndDate));
          
          if (startIdx === -1 || endIdx === -1) return null;
          
          // Calculate top position (140px is roughly header + row height)
          const top = 55 + (propertyIndex * 40);
          
          // Calculate left position (160px is property name column width)
          const left = 160 + (startIdx * 40);
          
          // Calculate width
          const width = ((endIdx - startIdx) + 1) * 40;
          
          return (
            <div 
              key={reservation.id}
              className="absolute pointer-events-auto"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: '32px'
              }}
            >
              {/* This is just a placeholder. The actual display is handled in PropertyRow */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MultiCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Fetch reservations and properties
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', 'multi', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => getReservationsForMonth(
      currentMonth.getMonth() + 1, 
      currentMonth.getFullYear()
    )
  });
  
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const isLoading = isLoadingReservations || isLoadingProperties;
  
  // Navigation functions
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  // Calculate days in month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Limit visible days based on screen size (use a fixed number that works well)
  const visibleDays = useMemo(() => {
    return monthDays.slice(0, 21); // Show up to 21 days (3 weeks)
  }, [monthDays]);
  
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
        <ScrollArea className="flex-1 w-full rounded-md border">
          <div className="relative min-w-full overflow-x-auto">
            {/* Table-like layout */}
            <div className="flex flex-col">
              {/* Header row with day names and dates */}
              <div className="flex sticky top-0 z-20 bg-white">
                {/* Corner cell */}
                <div className="sticky left-0 z-30 w-[160px] shrink-0 bg-white border-b border-r p-2 font-medium">
                  Properties
                </div>
                
                {/* Day headers */}
                {visibleDays.map((day, index) => (
                  <DayHeaderCell 
                    key={index} 
                    day={day} 
                    isToday={isSameDay(day, new Date())} 
                  />
                ))}
              </div>
              
              {/* Property rows */}
              {properties.map(property => (
                <PropertyRow 
                  key={property.id} 
                  property={property} 
                  days={visibleDays} 
                  reservations={reservations} 
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default MultiCalendar;
