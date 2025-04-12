
import { supabase } from "@/integrations/supabase/client";
import { Reservation, Platform, ReservationSource, ReservationStatus } from "@/types";

/**
 * Helper to normalize dates to noon to avoid timezone issues
 */
const normalizeDate = (date: Date): Date => {
  const newDate = new Date(date);
  // Set time to noon UTC to avoid any timezone issues
  newDate.setUTCHours(12, 0, 0, 0);
  return newDate;
};

/**
 * Transform data from Supabase's snake_case to camelCase for our app
 */
const mapReservationFromDatabase = (dbRes: any): Reservation => {
  return {
    id: dbRes.id,
    propertyId: dbRes.property_id,
    userId: dbRes.user_id || undefined,
    startDate: normalizeDate(new Date(dbRes.start_date)),
    endDate: normalizeDate(new Date(dbRes.end_date)),
    platform: dbRes.platform as Platform,
    source: dbRes.source as ReservationSource,
    status: dbRes.status as ReservationStatus || undefined,
    guestName: dbRes.guest_name || undefined,
    guestCount: dbRes.guest_count || undefined,
    contactInfo: dbRes.contact_info || undefined,
    icalUrl: dbRes.ical_url || undefined,
    notes: dbRes.notes || undefined,
    externalId: dbRes.external_id || undefined,
    isBlocking: dbRes.is_blocking || false,
    sourceReservationId: dbRes.source_reservation_id || undefined,
    isRelationshipBlock: false, // Default value, we'll set this when needed
    createdAt: new Date(dbRes.created_at)
  };
};

/**
 * Fetch all reservations from the database
 */
export const getReservations = async (filters?: {
  propertyId?: string;
  platform?: Platform;
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
}): Promise<Reservation[]> => {
  let query = supabase
    .from("reservations")
    .select("*");
  
  // Apply filters if provided
  if (filters) {
    if (filters.propertyId) {
      query = query.eq("property_id", filters.propertyId);
    }
    
    if (filters.platform) {
      query = query.eq("platform", filters.platform);
    }
    
    if (filters.startDate) {
      const startDate = filters.startDate.toISOString().split('T')[0];
      query = query.gte("start_date", startDate);
    }
    
    if (filters.endDate) {
      const endDate = filters.endDate.toISOString().split('T')[0];
      query = query.lte("end_date", endDate);
    }
    
    if (filters.searchText && filters.searchText.trim() !== '') {
      // Only filter if we have non-empty search text
      query = query.ilike("guest_name", `%${filters.searchText}%`);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching reservations:", error);
    throw error;
  }
  
  return data ? data.map(mapReservationFromDatabase) : [];
};

/**
 * Fetch reservations for a specific property
 */
export const getReservationsForProperty = async (propertyId: string): Promise<Reservation[]> => {
  // Get the property details to determine if it's a parent or child
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, parent_id, type")
    .eq("id", propertyId)
    .single();
  
  if (propertyError) {
    console.error(`Error fetching property ${propertyId}:`, propertyError);
    throw propertyError;
  }
  
  // Get direct reservations for this property
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("property_id", propertyId);
  
  if (error) {
    console.error(`Error fetching reservations for property ${propertyId}:`, error);
    throw error;
  }
  
  const directReservations = data ? data.map(mapReservationFromDatabase) : [];
  
  // Now, get related block reservations, depending on if this is a parent or child property
  let relatedReservations: Reservation[] = [];
  
  if (property) {
    if (property.type === 'parent') {
      // If this is a parent property, get blocks from child properties
      const { data: childProperties, error: childError } = await supabase
        .from("properties")
        .select("id")
        .eq("parent_id", propertyId);
      
      if (!childError && childProperties && childProperties.length > 0) {
        const childIds = childProperties.map(child => child.id);
        
        // Get reservations from child properties that should block this parent
        const { data: childReservations, error: childResError } = await supabase
          .from("reservations")
          .select("*")
          .in("property_id", childIds)
          .neq("status", "Blocked");  // Exclude those already marked as blocked
        
        if (!childResError && childReservations) {
          // Add related blocks from children to parent
          relatedReservations = childReservations.map(mapReservationFromDatabase);
        }
      }
    } else if (property.parent_id) {
      // If this is a child property, get blocks from parent property
      const parentId = property.parent_id;
      
      // Get reservations from parent property that should block this child
      const { data: parentReservations, error: parentResError } = await supabase
        .from("reservations")
        .select("*")
        .eq("property_id", parentId)
        .neq("status", "Blocked");  // Exclude those already marked as blocked
      
      if (!parentResError && parentReservations) {
        // Add related blocks from parent to child
        relatedReservations = parentReservations.map(mapReservationFromDatabase);
      }
    }
  }
  
  // Include the special property relationship blocks with a special flag
  const relationshipBlocks = relatedReservations.map(reservation => ({
    ...reservation,
    isRelationshipBlock: true
  }));
  
  // Combine direct reservations with relationship blocks
  return [...directReservations, ...relationshipBlocks];
};

/**
 * Fetch reservations for a specific month
 */
export const getReservationsForMonth = async (
  month: number,
  year: number
): Promise<Reservation[]> => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
  
  if (error) {
    console.error(`Error fetching reservations for ${month}/${year}:`, error);
    throw error;
  }
  
  return data ? data.map(mapReservationFromDatabase) : [];
};

/**
 * Create a new manual reservation
 */
export const createManualReservation = async (data: {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  guestName: string;
  guestCount?: number;
  contactInfo?: string;
  status?: ReservationStatus;
  notes?: string;
  userId?: string;
}): Promise<Reservation> => {
  const { propertyId, startDate, endDate, guestName, guestCount, contactInfo, status, notes, userId } = data;
  
  const { data: result, error } = await supabase
    .from("reservations")
    .insert({
      property_id: propertyId,
      user_id: userId || null,
      start_date: normalizeDate(startDate).toISOString().split('T')[0],
      end_date: normalizeDate(endDate).toISOString().split('T')[0],
      platform: 'Manual',
      source: 'Manual',
      status: status || 'Reserved',
      guest_name: guestName,
      guest_count: guestCount || null,
      contact_info: contactInfo || null,
      notes: notes || null
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating manual reservation:", error);
    throw error;
  }
  
  if (!result) {
    throw new Error("Failed to create reservation");
  }
  
  const reservation = mapReservationFromDatabase(result);
  
  // Propagate blocks between related properties
  await propagateReservationBlocks(reservation);
  
  return reservation;
};

/**
 * Create a new blocking reservation
 */
export const createBlockingReservation = async (data: {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  isBlocking?: boolean;
  sourceReservationId?: string;
  notes?: string;
}): Promise<Reservation> => {
  const { propertyId, startDate, endDate, isBlocking, sourceReservationId, notes } = data;
  
  const { data: result, error } = await supabase
    .from("reservations")
    .insert({
      property_id: propertyId,
      start_date: normalizeDate(startDate).toISOString().split('T')[0],
      end_date: normalizeDate(endDate).toISOString().split('T')[0],
      platform: 'Manual',
      source: 'Manual',
      status: 'Blocked',
      is_blocking: isBlocking || false,
      source_reservation_id: sourceReservationId || null,
      notes: notes || 'Blocked'
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating blocking reservation:", error);
    throw error;
  }
  
  return mapReservationFromDatabase(result);
};

/**
 * Update an existing manual reservation
 */
export const updateManualReservation = async (
  id: string,
  data: Partial<{
    propertyId: string;
    startDate: Date;
    endDate: Date;
    guestName: string;
    guestCount?: number;
    contactInfo?: string;
    status?: ReservationStatus;
    notes?: string;
  }>
): Promise<Reservation> => {
  const updates: Record<string, any> = {};
  
  if (data.propertyId) updates.property_id = data.propertyId;
  if (data.startDate) updates.start_date = normalizeDate(data.startDate).toISOString().split('T')[0];
  if (data.endDate) updates.end_date = normalizeDate(data.endDate).toISOString().split('T')[0];
  if (data.guestName !== undefined) updates.guest_name = data.guestName;
  if (data.guestCount !== undefined) updates.guest_count = data.guestCount;
  if (data.contactInfo !== undefined) updates.contact_info = data.contactInfo;
  if (data.status) updates.status = data.status;
  if (data.notes !== undefined) updates.notes = data.notes;
  
  const { data: result, error } = await supabase
    .from("reservations")
    .update(updates)
    .eq("id", id)
    .eq("source", "Manual") // Only update manual reservations
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating reservation ${id}:`, error);
    throw error;
  }
  
  if (!result) {
    throw new Error("Failed to update reservation or reservation not found");
  }
  
  return mapReservationFromDatabase(result);
};

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
 * Delete a manual reservation and its propagated blocks
 */
export const deleteManualReservation = async (id: string): Promise<void> => {
  // First delete any propagated blocks
  try {
    await deletePropagatedBlocks(id);
  } catch (error) {
    console.error(`Error deleting propagated blocks for reservation ${id}:`, error);
  }
  
  // Then delete the reservation itself
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id)
    .eq("source", "Manual"); // Only delete manual reservations
  
  if (error) {
    console.error(`Error deleting reservation ${id}:`, error);
    throw error;
  }
};

/**
 * Check if a property is available for a given date range
 */
export const checkAvailability = async (
  propertyId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string
): Promise<boolean> => {
  const start = normalizeDate(startDate).toISOString().split('T')[0];
  const end = normalizeDate(endDate).toISOString().split('T')[0];
  
  let query = supabase
    .from("reservations")
    .select("id")
    .eq("property_id", propertyId)
    .or(`start_date.lt.${end},end_date.gt.${start}`);
  
  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error checking availability:", error);
    throw error;
  }
  
  // If data is empty, the property is available
  return !data || data.length === 0;
};

/**
 * New method to propagate blocks between related properties
 */
export const propagateReservationBlocks = async (
  reservation: Reservation
): Promise<Reservation[]> => {
  // Get property with its children, but using a simplified query to avoid recursion
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, type")
    .eq("id", reservation.propertyId)
    .single();
  
  if (propertyError) {
    console.error("Error fetching property for block propagation:", propertyError);
    return [];
  }
  
  // If this is a parent property, we need to get its children separately
  let children: { id: string }[] = [];
  
  if (property.type === 'parent') {
    const { data: childProperties, error: childrenError } = await supabase
      .from("properties")
      .select("id")
      .eq("parent_id", property.id);
      
    if (!childrenError && childProperties) {
      children = childProperties;
    }
  }
  
  const propagatedReservations: Reservation[] = [];
  
  // If this is a parent property, block all child properties
  if (property.type === 'parent' && children.length > 0) {
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

/**
 * Get the property name for a given property ID
 */
export const getPropertyName = async (propertyId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("properties")
    .select("name")
    .eq("id", propertyId)
    .single();
  
  if (error) {
    console.error(`Error fetching property name for ${propertyId}:`, error);
    return 'Propiedad desconocida';
  }
  
  return data?.name || 'Propiedad desconocida';
};
