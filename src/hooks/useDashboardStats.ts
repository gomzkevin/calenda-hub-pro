
import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { getDaysInMonth } from 'date-fns';

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
      return res.propertyId === property.id &&
             startDate.getMonth() === today.getMonth() &&
             startDate.getFullYear() === today.getFullYear();
    });
    
    // Calculate total days booked this month
    const daysBooked = propertyReservations.reduce((total, res) => {
      const startDate = new Date(res.startDate);
      const endDate = new Date(res.endDate);
      const daysInReservation = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return total + daysInReservation;
    }, 0);
    
    // Calculate occupancy rate based on days in month
    const occupancyRate = (daysBooked / daysInMonth) * 100;
    
    return {
      ...property,
      occupancyRate
    };
  });
  
  return {
    propertyOccupancy
  };
};
