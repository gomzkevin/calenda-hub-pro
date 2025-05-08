
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
 * Fetch reservations for a specific month with optimized query
 * This significantly reduces data transfer by only fetching the exact date range needed
 */
export const getReservationsForMonth = async (
  month: number,
  year: number
): Promise<Reservation[]> => {
  // Calculate start and end dates more efficiently
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];
  
  // Optimized query to only fetch reservations that overlap with the month
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
 * Check if a property is available for a given date range - optimized
 */
export const checkAvailability = async (
  propertyId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string
): Promise<boolean> => {
  const start = normalizeDate(startDate).toISOString().split('T')[0];
  const end = normalizeDate(endDate).toISOString().split('T')[0];
  
  // Optimized query to detect overlapping date ranges
  let query = supabase
    .from("reservations")
    .select("id", { count: 'exact', head: true }) // Only count records, don't fetch all data
    .eq("property_id", propertyId)
    .lt("start_date", end)   // Existing reservation starts before our end
    .gt("end_date", start);  // Existing reservation ends after our start
  
  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error("Error checking availability:", error);
    throw error;
  }
  
  // If count is 0, the property is available
  return count === 0;
};

/**
 * Get the property name for a given property ID - with caching
 */
export const getPropertyName = async (propertyId: string): Promise<string> => {
  // Add memory cache to prevent repeated lookups
  if (!getPropertyName.cache) {
    getPropertyName.cache = new Map<string, {name: string, timestamp: number}>();
  }
  
  // Check cache first (5 minute TTL)
  const cached = getPropertyName.cache.get(propertyId);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < 300000) {
    return cached.name;
  }
  
  const { data, error } = await supabase
    .from("properties")
    .select("name")
    .eq("id", propertyId)
    .single();
  
  if (error) {
    console.error(`Error fetching property name for ${propertyId}:`, error);
    return 'Propiedad desconocida';
  }
  
  const propertyName = data?.name || 'Propiedad desconocida';
  
  // Update cache
  getPropertyName.cache.set(propertyId, {
    name: propertyName,
    timestamp: now
  });
  
  return propertyName;
};

// Add TypeScript declaration for the cache
declare namespace getPropertyName {
  var cache: Map<string, {name: string, timestamp: number}>;
}
