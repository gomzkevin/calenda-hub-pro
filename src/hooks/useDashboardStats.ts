
import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { getDaysInMonth, isSameMonth, isSameYear, differenceInDays, addDays } from 'date-fns';

export const useDashboardStats = () => {
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties
  });
  
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getReservations()
  });
  
  const propertyOccupancy = properties.map(property => {
    // Filter reservations for this property in the current month
    const propertyReservations = reservations.filter(res => {
      const startDate = new Date(res.startDate);
      const endDate = new Date(res.endDate);
      
      // Check if the reservation overlaps with the current month
      return res.propertyId === property.id &&
             ((isSameMonth(startDate, today) && isSameYear(startDate, today)) ||
              (isSameMonth(endDate, today) && isSameYear(endDate, today)) ||
              (startDate < today && endDate > new Date(today.getFullYear(), today.getMonth() + 1, 0)));
    });
    
    // Calculate total days booked this month, accounting for partial month reservations
    let daysBooked = 0;
    
    propertyReservations.forEach(res => {
      const startDate = new Date(res.startDate);
      const endDate = new Date(res.endDate);
      
      // Calculate the start date to count from (either reservation start or beginning of month)
      const countFromDate = startDate < new Date(today.getFullYear(), today.getMonth(), 1) 
        ? new Date(today.getFullYear(), today.getMonth(), 1) 
        : startDate;
      
      // Calculate the end date to count to (either reservation end or end of month)
      const countToDate = endDate > new Date(today.getFullYear(), today.getMonth() + 1, 0) 
        ? new Date(today.getFullYear(), today.getMonth() + 1, 0) 
        : endDate;
      
      // Add 1 to include the end date in the count (checkout day)
      daysBooked += differenceInDays(addDays(countToDate, 1), countFromDate);
    });
    
    // Calculate occupancy rate based on days in month
    const occupancyRate = (daysBooked / daysInMonth) * 100;
    
    return {
      ...property,
      occupancyRate: Math.min(occupancyRate, 100) // Cap at 100% maximum
    };
  });
  
  return {
    propertyOccupancy
  };
};
