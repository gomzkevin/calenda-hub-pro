
import { useState, useEffect } from 'react';
import { addDays, eachDayOfInterval, endOfMonth, isValid, startOfMonth, subDays } from 'date-fns';

export const useDateNavigation = (daysToShow = 15) => {
  // Inicializar con la fecha actual
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Normalizar a mediodía para evitar problemas de zona horaria
  
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(addDays(today, daysToShow - 1));
  
  // Validación de fechas
  useEffect(() => {
    if (!isValid(startDate) || !isValid(endDate)) {
      console.error("Invalid dates detected in useDateNavigation", { startDate, endDate });
      const validStart = new Date();
      validStart.setHours(12, 0, 0, 0);
      setStartDate(validStart);
      setEndDate(addDays(validStart, daysToShow - 1));
    }
  }, [startDate, endDate, daysToShow]);
  
  // Generar array de días visibles
  const visibleDays = isValid(startDate) && isValid(endDate) ? 
    eachDayOfInterval({ start: startDate, end: endDate }) : 
    Array(daysToShow).fill(0).map((_, i) => addDays(today, i));
  
  // Navegar hacia adelante en el tiempo
  const goForward = () => {
    if (isValid(endDate)) {
      const newStart = addDays(endDate, 1);
      const newEnd = addDays(newStart, daysToShow - 1);
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };
  
  // Navegar hacia atrás en el tiempo
  const goBackward = () => {
    if (isValid(startDate)) {
      const newEnd = subDays(startDate, 1);
      const newStart = subDays(newEnd, daysToShow - 1);
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };
  
  return {
    startDate,
    endDate,
    visibleDays,
    goForward,
    goBackward,
    daysToShow
  };
};
