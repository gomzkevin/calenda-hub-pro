
import { supabase } from "@/integrations/supabase/client";
import { Reservation, Platform } from "@/types";
import { mapReservationFromDatabase, normalizeDate } from "./utils";

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
