
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
    checkingOut: [] as Reservation[],        // Salen hoy (hasta 12:00 PM)
    checkingIn: [] as Reservation[],         // Llegan hoy (todo el día)
    active: [] as Reservation[],             // En curso
    checkingOutTomorrow: [] as Reservation[], // Terminan mañana
    checkingInTomorrow: [] as Reservation[], // Empiezan pronto
    upcoming: [] as Reservation[]            // Próximas reservas
  };

  reservations.forEach(reservation => {
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);

    // Updated logic: checkingIn is now for the entire day
    if (isToday(startDate)) {
      groups.checkingIn.push(reservation);
    } else if (isToday(endDate)) {
      if (now.getHours() < 12) { // Before 12:00 PM
        groups.checkingOut.push(reservation);
      }
    } else if (isTomorrow(startDate)) {
      groups.checkingInTomorrow.push(reservation);
    } else if (isTomorrow(endDate)) {
      groups.checkingOutTomorrow.push(reservation);
    } else if (isAfter(startDate, addDays(now, 1))) {
      groups.upcoming.push(reservation);
    }

    // Add to active if staying tonight
    if (isToday(startDate) || (isBefore(startDate, now) && isAfter(endDate, now))) {
      groups.active.push(reservation);
    }
  });

  return groups;
};
