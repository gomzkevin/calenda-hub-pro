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
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("property_id", propertyId);
  
  if (error) {
    console.error(`Error fetching reservations for property ${propertyId}:`, error);
    throw error;
  }
  
  return data ? data.map(mapReservationFromDatabase) : [];
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
  
  return mapReservationFromDatabase(result);
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
 * Delete a manual reservation
 */
export const deleteManualReservation = async (id: string): Promise<void> => {
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
    .or(`start_date.lt.${end},end_date.gt.${start}`)
    .not("status", "eq", "Tentative"); // Ignore tentative reservations
  
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
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*, children:properties(id)")
    .eq("id", reservation.propertyId)
    .single();
  
  if (propertyError) {
    console.error("Error fetching property for block propagation:", propertyError);
    return [];
  }
  
  const propagatedReservations: Reservation[] = [];
  
  // If this is a parent property, block all child properties
  if (property.type === 'parent' && property.children?.length) {
    for (const child of property.children) {
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
