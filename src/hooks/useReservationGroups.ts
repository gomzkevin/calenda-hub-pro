
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

    // Updated logic: checkingIn is now for the entire day
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

    // Nueva lógica para reservas activas: solo reservas regulares (no propagadas)
    if (!reservation.isRelationshipBlock && !reservation.sourceReservationId &&
        ((isToday(startDate) && now.getHours() >= 12) || // Si empezó hoy después del mediodía
         (isBefore(startDate, now) && isAfter(endDate, now)))) { // O si está en curso
      groups.active.push(reservation);
    }
  });

  return groups;
};
