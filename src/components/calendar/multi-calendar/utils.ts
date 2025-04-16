
import { Property, Reservation } from "@/types";

// Normalize dates to compare them correctly
export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  // Ensure we set to noon local time to avoid timezone issues
  normalized.setHours(12, 0, 0, 0);
  return normalized;
};

// Sort reservations by start date and platform
export const sortReservations = (resA: Reservation, resB: Reservation): number => {
  // First compare start dates
  const startDiff = resA.startDate.getTime() - resB.startDate.getTime();
  if (startDiff !== 0) return startDiff;
  
  // If same start date, compare platforms
  return resA.platform.localeCompare(resB.platform);
};

// Get styling for a reservation
export const getReservationStyle = (reservation: Reservation, isIndirect: boolean): string => {
  // If this is a propagated block (either from parent-child relationship or sourceReservationId),
  // always use the gray color regardless of the original reservation's platform
  if (isIndirect || reservation.status === 'Blocked' || reservation.notes === 'Blocked') {
    return 'bg-gray-400';
  }
  
  // For direct reservations, use platform-specific colors
  switch (reservation.platform.toLowerCase()) {
    case 'airbnb': return 'bg-rose-500';
    case 'booking': return 'bg-blue-600';
    case 'vrbo': return 'bg-green-600';
    case 'other': return 'bg-purple-600';
    default: return 'bg-purple-600';
  }
};

// Calculate property lanes for positioning reservations
export const calculatePropertyLanes = (
  properties: Property[],
  getReservationsForProperty: (propertyId: string) => Reservation[]
): Map<string, number> => {
  const propertyLanes = new Map<string, number>();
  
  // For each property, assign lanes to its reservations
  properties.forEach(property => {
    const reservations = getReservationsForProperty(property.id);
    
    // For simplicity, all reservations get lane 0 for now
    reservations.forEach(reservation => {
      propertyLanes.set(`${property.id}-${reservation.id}`, 0);
    });
  });
  
  return propertyLanes;
};
