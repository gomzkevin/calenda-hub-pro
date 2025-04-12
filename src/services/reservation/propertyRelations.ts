
import { supabase } from "@/integrations/supabase/client";
import { Reservation } from "@/types";
import { mapReservationFromDatabase } from "./utils";

/**
 * Fetch reservations for a specific property
 */
export const getReservationsForProperty = async (propertyId: string): Promise<Reservation[]> => {
  // Step 1: Get basic property information first, without any nested selects
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, parent_id, type")
    .eq("id", propertyId)
    .single();
  
  if (propertyError) {
    console.error(`Error fetching property ${propertyId}:`, propertyError);
    throw propertyError;
  }
  
  // Step 2: Get direct reservations for this property
  const { data: directReservationsData, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("property_id", propertyId);
  
  if (error) {
    console.error(`Error fetching reservations for property ${propertyId}:`, error);
    throw error;
  }
  
  const directReservations = directReservationsData ? directReservationsData.map(mapReservationFromDatabase) : [];
  
  // Step 3: Get related block reservations based on property relationship
  let relatedReservations: Reservation[] = [];
  
  if (property) {
    // For parent property: get child property reservations
    if (property.type === 'parent') {
      // Step 3a: Get child properties as a separate query
      const { data: childProperties, error: childError } = await supabase
        .from("properties")
        .select("id")
        .eq("parent_id", propertyId);
      
      if (childError) {
        console.error(`Error fetching child properties for parent ${propertyId}:`, childError);
      } else if (childProperties && childProperties.length > 0) {
        const childIds = childProperties.map(child => child.id);
        
        // Step 3b: Get reservations from these children
        const { data: childReservationsData, error: childResError } = await supabase
          .from("reservations")
          .select("*")
          .in("property_id", childIds)
          .neq("status", "Blocked");  // Exclude those already marked as blocked
        
        if (childResError) {
          console.error(`Error fetching child reservations for parent ${propertyId}:`, childResError);
        } else if (childReservationsData) {
          // Add related blocks from children to parent
          relatedReservations = childReservationsData.map(mapReservationFromDatabase);
        }
      }
    } 
    // For child property: get parent property reservations
    else if (property.parent_id) {
      const parentId = property.parent_id;
      
      // Step 3c: Get reservations from parent property
      const { data: parentReservationsData, error: parentResError } = await supabase
        .from("reservations")
        .select("*")
        .eq("property_id", parentId)
        .neq("status", "Blocked");  // Exclude those already marked as blocked
      
      if (parentResError) {
        console.error(`Error fetching parent reservations for child ${propertyId}:`, parentResError);
      } else if (parentReservationsData) {
        // Add related blocks from parent to child
        relatedReservations = parentReservationsData.map(mapReservationFromDatabase);
      }
    }
  }
  
  // Step 4: Include the special property relationship blocks with a special flag
  const relationshipBlocks = relatedReservations.map(reservation => ({
    ...reservation,
    isRelationshipBlock: true
  }));
  
  // Step 5: Combine direct reservations with relationship blocks
  return [...directReservations, ...relationshipBlocks];
};

/**
 * Check if all other child rooms are available for a specific date range
 */
export const checkOtherRoomsAvailability = async (
  childrenIds: string[],
  currentChildId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  // Get all other child properties except the current one
  const otherChildIds = childrenIds.filter(id => id !== currentChildId);
  
  // Import the checkAvailability function
  const { checkAvailability } = await import('./queries');
  
  // Check if at least one other room is available
  for (const childId of otherChildIds) {
    const isAvailable = await checkAvailability(childId, startDate, endDate);
    if (isAvailable) {
      // If at least one room is available, return true
      return true;
    }
  }
  
  // If no rooms are available, return false
  return false;
};
