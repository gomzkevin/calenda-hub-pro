
import { Reservation } from '@/types';
import { normalizeDate } from '../../utils/dateUtils';

/**
 * Filter reservations that overlap with a specific week
 */
export const filterReservationsForWeek = (
  week: (Date | null)[],
  reservations: Reservation[]
): Reservation[] => {
  if (!week[0]) return [];
  
  return reservations.filter(reservation => {
    return week.some(day => {
      if (!day) return false;
      const normalizedDay = normalizeDate(day);
      return normalizedDay <= reservation.endDate && normalizedDay >= reservation.startDate;
    });
  });
};
