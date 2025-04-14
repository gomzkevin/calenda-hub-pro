
import { normalizeDate } from "./dateUtils";
import { Reservation } from "@/types";
import { isSameDay, differenceInDays } from "date-fns";

/**
 * Mejorada: cálculo de lanes para reservas por semana
 * Verifica específicamente qué reservas están visibles en cada semana
 */
export const calculateReservationLanes = (
  weeks: (Date | null)[][],
  reservations: Reservation[]
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    
    // Solo considera días válidos (no nulos) en la semana
    const validDays = week.filter(day => day !== null) as Date[];
    if (validDays.length === 0) {
      lanes[weekIndex] = weekLanes;
      return;
    }
    
    // Obtener primer y último día de la semana para comparaciones
    const firstDayOfWeek = normalizeDate(new Date(validDays[0]));
    const lastDayOfWeek = normalizeDate(new Date(validDays[validDays.length - 1]));
    
    // Filtrar reservas que se superponen con esta semana específica
    let weekReservations = reservations.filter(reservation => {
      const normalizedStartDate = normalizeDate(new Date(reservation.startDate));
      const normalizedEndDate = normalizeDate(new Date(reservation.endDate));
      
      // Una reserva está en esta semana si:
      // 1. Su fecha de inicio está dentro de la semana, o
      // 2. Su fecha de fin está dentro de la semana, o
      // 3. Su período de inicio-fin engloba completamente la semana
      return (
        // Inicio dentro de la semana
        (normalizedStartDate >= firstDayOfWeek && normalizedStartDate <= lastDayOfWeek) || 
        // Fin dentro de la semana
        (normalizedEndDate >= firstDayOfWeek && normalizedEndDate <= lastDayOfWeek) ||
        // Abarca la semana completa
        (normalizedStartDate < firstDayOfWeek && normalizedEndDate > lastDayOfWeek)
      );
    });
    
    // En nuestro enfoque simplificado, todas las reservas obtienen lane 0
    weekReservations.forEach(reservation => {
      weekLanes[reservation.id] = 0;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};

/**
 * Mejorada: cálculo de lanes para bloques por semana
 * Sigue la misma lógica mejorada que calculateReservationLanes
 */
export const calculateBlockLanes = (
  weeks: (Date | null)[][],
  blocks: Reservation[] | undefined
): Record<number, Record<string, number>> => {
  const lanes: Record<number, Record<string, number>> = {};
  
  // Retorno temprano si blocks es undefined o vacío
  if (!blocks || blocks.length === 0) return lanes;
  
  weeks.forEach((week, weekIndex) => {
    const weekLanes: Record<string, number> = {};
    
    // Solo considera días válidos (no nulos) en la semana
    const validDays = week.filter(day => day !== null) as Date[];
    if (validDays.length === 0) {
      lanes[weekIndex] = weekLanes;
      return;
    }
    
    // Obtener primer y último día de la semana para comparaciones
    const firstDayOfWeek = normalizeDate(new Date(validDays[0]));
    const lastDayOfWeek = normalizeDate(new Date(validDays[validDays.length - 1]));
    
    // Filtrar bloques que se superponen con esta semana específica
    const weekBlocks = blocks.filter(block => {
      const normalizedStartDate = normalizeDate(new Date(block.startDate));
      const normalizedEndDate = normalizeDate(new Date(block.endDate));
      
      return (
        // Inicio dentro de la semana
        (normalizedStartDate >= firstDayOfWeek && normalizedStartDate <= lastDayOfWeek) || 
        // Fin dentro de la semana
        (normalizedEndDate >= firstDayOfWeek && normalizedEndDate <= lastDayOfWeek) ||
        // Abarca la semana completa
        (normalizedStartDate < firstDayOfWeek && normalizedEndDate > lastDayOfWeek)
      );
    });
    
    // Todos los bloques obtienen lane 0 en nuestro enfoque simplificado
    weekBlocks.forEach(block => {
      weekLanes[block.id] = 0;
    });
    
    lanes[weekIndex] = weekLanes;
  });
  
  return lanes;
};
