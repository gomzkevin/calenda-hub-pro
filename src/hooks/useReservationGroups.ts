
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

    // Corregida la lógica para reservas activas:
    // 1. No incluir bloqueos propagados ni reservas con sourceReservationId
    // 2. Solo incluir reservas que estén activas hoy (después de la fecha de inicio y antes de la fecha de fin)
    // 3. No incluir reservas con notes igual a "Blocked"
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
