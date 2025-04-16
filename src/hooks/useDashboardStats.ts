
import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { getDaysInMonth, isSameMonth, isSameYear, differenceInDays, addDays, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

export const useDashboardStats = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = getDaysInMonth(today);
  
  // First day of current month
  const monthStart = startOfMonth(today);
  // Last day of current month
  const monthEnd = endOfMonth(today);
  
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getReservations()
  });
  
  const propertyOccupancy = properties.map(property => {
    // Filter reservations for this property that overlap with the current month
    const propertyReservations = reservations.filter(res => {
      const startDate = new Date(res.startDate);
      const endDate = new Date(res.endDate);
      
      // Check if the reservation overlaps with the current month
      return res.propertyId === property.id &&
             ((isSameMonth(startDate, today) && isSameYear(startDate, today)) ||
              (isSameMonth(endDate, today) && isSameYear(endDate, today)) ||
              (startDate < monthStart && endDate > monthEnd));
    });
    
    // Calculate occupied nights for the current month only
    let occupiedNights = 0;
    
    // For each day in the month, check if it's within any reservation
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      
      // Check if this date is within any of the property's reservations
      const isOccupied = propertyReservations.some(res => {
        const startDate = new Date(res.startDate);
        const endDate = new Date(res.endDate);
        
        // A night is occupied if the day falls between check-in and check-out dates (inclusive of check-in, exclusive of check-out)
        return isWithinInterval(currentDate, { 
          start: startDate, 
          end: new Date(endDate.getTime() - 1) // Subtract 1ms to make it exclusive of checkout day
        });
      });
      
      if (isOccupied) {
        occupiedNights++;
      }
    }
    
    // Calculate occupancy rate based on nights occupied in the month
    const occupancyRate = (occupiedNights / daysInMonth) * 100;
    
    return {
      ...property,
      occupancyRate: Math.min(occupancyRate, 100) // Cap at 100% maximum
    };
  });
  
  return {
    propertyOccupancy
  };
};
