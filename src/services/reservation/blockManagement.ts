
import { supabase } from "@/integrations/supabase/client";
import { Reservation } from "@/types";
import { createBlockingReservation } from "./mutations";

/**
 * Delete propagated blocks when a source reservation is deleted
 */
export const deletePropagatedBlocks = async (sourceReservationId: string): Promise<void> => {
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("source_reservation_id", sourceReservationId);
  
  if (error) {
    console.error(`Error deleting propagated blocks for source reservation ${sourceReservationId}:`, error);
    throw error;
  }
};

/**
 * New method to propagate blocks between related properties
 */
export const propagateReservationBlocks = async (
  reservation: Reservation
): Promise<Reservation[]> => {
  // Get property information without nested selects
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, type")
    .eq("id", reservation.propertyId)
    .single();
  
  if (propertyError) {
    console.error("Error fetching property for block propagation:", propertyError);
    return [];
  }
  
  // Get child properties in a separate query to avoid type recursion
  let children: { id: string }[] = [];
  
  if (property && property.type === 'parent') {
    const { data: childProperties, error: childrenError } = await supabase
      .from("properties")
      .select("id")
      .eq("parent_id", property.id);
      
    if (childrenError) {
      console.error(`Error fetching child properties for parent ${property.id}:`, childrenError);
    } else if (childProperties) {
      children = childProperties;
    }
  }
  
  const propagatedReservations: Reservation[] = [];
  
  // If this is a parent property, block all child properties
  if (property && property.type === 'parent' && children.length > 0) {
    for (const child of children) {
      try {
        const blockedChildReservation = await createBlockingReservation({
          propertyId: child.id,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          isBlocking: true,
          sourceReservationId: reservation.id,
          notes: `Blocked by parent reservation ${reservation.id}`
        });
        
        propagatedReservations.push(blockedChildReservation);
      } catch (err) {
        console.error(`Error blocking child property ${child.id}:`, err);
      }
    }
  }
  
  return propagatedReservations;
};
