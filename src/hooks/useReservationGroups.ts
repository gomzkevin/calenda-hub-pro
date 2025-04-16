
import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { Reservation } from '@/types';
import { format, isToday, isTomorrow, isAfter, isBefore, addDays } from 'date-fns';

export const useReservationGroups = () => {
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations
  });

  const now = new Date();
  const mexicoCityTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    hour: 'numeric',
    hour12: false
  }).format(now);
  const currentHour = parseInt(mexicoCityTime, 10);

  const groups = {
    checkingOut: [] as Reservation[],        // Salen hoy (hasta 12:00 PM)
    checkingIn: [] as Reservation[],         // Llegan hoy (hasta 3:00 PM)
    active: [] as Reservation[],             // En curso
    checkingOutTomorrow: [] as Reservation[], // Terminan pronto
    checkingInTomorrow: [] as Reservation[], // Empiezan pronto
    upcoming: [] as Reservation[]            // Próximas reservas
  };

  reservations.forEach(reservation => {
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);

    if (isToday(startDate)) {
      if (currentHour < 15) { // Before 3:00 PM
        groups.checkingIn.push(reservation);
      } else {
        groups.active.push(reservation);
      }
    } else if (isToday(endDate)) {
      if (currentHour < 12) { // Before 12:00 PM
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
