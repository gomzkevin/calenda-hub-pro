
import { supabase } from "@/integrations/supabase/client";
import { Reservation, ReservationStatus, Platform } from "@/types";
import { mapReservationFromDatabase, normalizeDate } from "./utils";

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
  
  // Create payload with all fields that exist in the database
  const payload = {
    property_id: propertyId,
    user_id: userId || null,
    start_date: normalizeDate(startDate).toISOString().split('T')[0],
    end_date: normalizeDate(endDate).toISOString().split('T')[0],
    platform: 'Other' as Platform, // Changed from 'Manual' to 'Other' which is in the allowed values
    source: 'Manual',
    status: status || 'Reserved',
    guest_name: guestName,
    guest_count: guestCount || null,
    notes: notes || null
  };
  
  // If contactInfo is provided, store it in the notes field as a fallback
  if (contactInfo) {
    payload.notes = payload.notes 
      ? `${payload.notes}\nContacto: ${contactInfo}` 
      : `Contacto: ${contactInfo}`;
  }
  
  const { data: result, error } = await supabase
    .from("reservations")
    .insert(payload)
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
  const { propagateReservationBlocks } = await import('./blockManagement');
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
      platform: 'Other', // Changed from 'Manual' to 'Other'
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
  if (data.status) updates.status = data.status;
  
  // Handle contactInfo by adding it to notes
  if (data.contactInfo !== undefined) {
    if (data.notes !== undefined) {
      updates.notes = `${data.notes}\nContacto: ${data.contactInfo}`;
    } else {
      // If we're updating contactInfo but not notes, we need to fetch current notes
      const { data: currentReservation } = await supabase
        .from("reservations")
        .select("notes")
        .eq("id", id)
        .single();
      
      updates.notes = currentReservation && currentReservation.notes
        ? `${currentReservation.notes}\nContacto: ${data.contactInfo}`
        : `Contacto: ${data.contactInfo}`;
    }
  } else if (data.notes !== undefined) {
    updates.notes = data.notes;
  }
  
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
 * Delete a manual reservation and its propagated blocks
 */
export const deleteManualReservation = async (id: string): Promise<void> => {
  // First delete any propagated blocks
  const { deletePropagatedBlocks } = await import('./blockManagement');
  
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
