import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { Reservation } from '@/types';
import { format, isToday, isTomorrow, isAfter, isBefore, addDays } from 'date-fns';

export const useReservationGroups = () => {
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getReservations()
  });

  const now = new Date();

  const groups = {
    checkingOut: [] as Reservation[],
    checkingIn: [] as Reservation[],
    active: [] as Reservation[],
    checkingOutTomorrow: [] as Reservation[],
    checkingInTomorrow: [] as Reservation[],
    upcoming: [] as Reservation[]
  };

  reservations.forEach(reservation => {
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);

    if (isToday(startDate)) {
      groups.checkingIn.push(reservation);
    } else if (isToday(endDate)) {
      if (now.getHours() < 12) {
        groups.checkingOut.push(reservation);
      }
    } else if (isTomorrow(startDate)) {
      groups.checkingInTomorrow.push(reservation);
    } else if (isTomorrow(endDate)) {
      groups.checkingOutTomorrow.push(reservation);
    } else if (isAfter(startDate, addDays(now, 1))) {
      groups.upcoming.push(reservation);
    }

    if (!reservation.isRelationshipBlock && 
        !reservation.sourceReservationId &&
        reservation.notes !== 'Blocked' &&
        isBefore(startDate, now) && 
        isAfter(endDate, now)) {
      groups.active.push(reservation);
    }
  });

  return groups;
};
