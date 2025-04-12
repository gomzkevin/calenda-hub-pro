
import { isSameDay } from 'date-fns';
import { Reservation, Property } from '@/types';
import { getPlatformColorClass } from '@/data/mockData';

// Normalize date to avoid timezone issues
export const normalizeDate = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setUTCHours(12, 0, 0, 0);
  return newDate;
};

// Sort reservations by start date, end date and id
export const sortReservations = (resA: Reservation, resB: Reservation): number => {
  const startDiff = resA.startDate.getTime() - resB.startDate.getTime();
  if (startDiff !== 0) return startDiff;
  
  const endDiff = resB.endDate.getTime() - resA.endDate.getTime();
  if (endDiff !== 0) return endDiff;
  
  return resA.id.localeCompare(resB.id);
};

// Get reservation style based on its type
export const getReservationStyle = (reservation: Reservation, isIndirect = false): string => {
  if (isIndirect) {
    return 'bg-gray-100 text-gray-500 border border-dashed border-gray-300';
  }
  
  if (reservation.status === 'Blocked' && (reservation.sourceReservationId || reservation.isBlocking)) {
    return 'bg-gray-400 text-white border border-dashed border-white';
  }
  
  return getPlatformColorClass(reservation.platform);
};

// Calculate property lanes for positioning reservations
export const calculatePropertyLanes = (
  properties: Property[], 
  getReservationsForProperty: (propertyId: string) => Reservation[]
): Map<string, number> => {
  const laneMap = new Map<string, number>();
  
  properties.forEach(property => {
    const propertyReservations = getReservationsForProperty(property.id);
    
    const sortedReservations = [...propertyReservations].sort(sortReservations);
    
    const lanesToEndDates = new Map<number, Date>();
    
    sortedReservations.forEach(reservation => {
      const reservationStart = normalizeDate(reservation.startDate);
      const reservationEnd = normalizeDate(reservation.endDate);
      
      let lane = 0;
      let foundLane = false;
      
      while (!foundLane) {
        const endDate = lanesToEndDates.get(lane);
        
        if (!endDate || endDate < reservationStart) {
          foundLane = true;
          lanesToEndDates.set(lane, reservationEnd);
          laneMap.set(`${property.id}-${reservation.id}`, lane);
        } else {
          lane++;
        }
      }
    });
  });
  
  return laneMap;
};
