
import { Reservation } from "@/types";
import { getReservationColorClass } from "./index";

/**
 * Calculates styling for a reservation bar
 */
export const getReservationStyle = (
  reservation: Reservation,
  startPixel: number,
  width: number,
  laneIndex: number,
  laneHeight: number = 24,
  laneGap: number = 2
) => {
  const top = laneIndex * (laneHeight + laneGap);
  const colorClass = getReservationColorClass(reservation);
  
  return {
    left: `${startPixel}px`,
    width: `${width}px`,
    height: `${laneHeight}px`,
    top: `${top}px`,
    colorClass,
  };
};
