
import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { Property, Reservation } from '@/types';
import { isSameDay, isWithinInterval, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';

export const useDashboardStats = () => {
  const today = new Date();
  
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getReservations()
  });
  
  // Basic stats
  const totalProperties = properties.length;
  
  const activeReservations = reservations.filter(res => 
    isWithinInterval(today, { 
      start: new Date(res.startDate), 
      end: new Date(res.endDate) 
    })
  ).length;
  
  const checkInsToday = reservations.filter(res => 
    isSameDay(new Date(res.startDate), today)
  ).length;
  
  const checkOutsToday = reservations.filter(res => 
    isSameDay(new Date(res.endDate), today)
  ).length;
  
  // Calculate occupancy rates for the current month
  const calculateOccupancy = (property: Property, reservations: Reservation[]) => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = getDaysInMonth(today);
    
    // Filter relevant reservations
    let relevantReservations = reservations.filter(res => {
      const startDate = new Date(res.startDate);
      const endDate = new Date(res.endDate);
      
      // Check if reservation overlaps with current month
      return (
        (startDate <= monthEnd && endDate >= monthStart) &&
        (
          // For parent properties, only count direct reservations
          (property.type === 'parent' && !res.sourceReservationId) ||
          // For child properties, count both direct reservations and propagated blocks
          (property.type === 'child' && 
            (res.propertyId === property.id || 
             (res.sourceReservationId && property.parentId === res.propertyId))
          ) ||
          // For standalone properties, count all reservations
          ((!property.type || property.type === 'standalone') && res.propertyId === property.id)
        )
      );
    });
    
    // Calculate occupied days
    let occupiedDays = 0;
    const monthDays = Array.from(
      { length: daysInMonth }, 
      (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1)
    );
    
    monthDays.forEach(day => {
      if (relevantReservations.some(res => 
        isWithinInterval(day, {
          start: new Date(res.startDate),
          end: new Date(res.endDate)
        })
      )) {
        occupiedDays++;
      }
    });
    
    return (occupiedDays / daysInMonth) * 100;
  };
  
  // Calculate occupancy for each property
  const propertyOccupancy = properties.map(property => ({
    ...property,
    occupancyRate: calculateOccupancy(property, reservations)
  }));
  
  return {
    totalProperties,
    activeReservations,
    checkInsToday,
    checkOutsToday,
    propertyOccupancy
  };
};
