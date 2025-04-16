
import { useQuery } from '@tanstack/react-query';
import { getReservations } from '@/services/reservation';
import { Reservation } from '@/types';
import { format, isToday, isTomorrow, isAfter, isBefore, addDays } from 'date-fns';

export const useReservationGroups = () => {
  const { data: allReservations = [] } = useQuery({
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

  // Filtrar primero para excluir las reservas bloqueadas y propagadas
  const validReservations = allReservations.filter(reservation => 
    reservation.notes !== 'Blocked' && 
    reservation.status !== 'Blocked' &&
    !reservation.sourceReservationId &&
    !reservation.isRelationshipBlock
  );

  validReservations.forEach(reservation => {
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
      // Solo incluir en próximas reservas si la fecha de inicio es después de mañana
      groups.upcoming.push(reservation);
    }

    // Comprobar si está activa (inicio en el pasado y fin en el futuro)
    if (isBefore(startDate, now) && isAfter(endDate, now)) {
      groups.active.push(reservation);
    }
  });

  return groups;
};
