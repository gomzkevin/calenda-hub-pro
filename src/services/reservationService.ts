
import { supabase } from "@/integrations/supabase/client";
import { Reservation } from "@/types";

/**
 * Fetch all reservations from the database
 */
export const getReservations = async (): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select("*");
  
  if (error) {
    console.error("Error fetching reservations:", error);
    throw error;
  }
  
  return data ? data.map((res) => ({
    id: res.id,
    propertyId: res.property_id,
    userId: res.user_id || undefined,
    startDate: new Date(res.start_date),
    endDate: new Date(res.end_date),
    platform: res.platform as any,
    source: res.source as any,
    icalUrl: res.ical_url || undefined,
    notes: res.notes || undefined,
    createdAt: new Date(res.created_at)
  })) : [];
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
  
  return data ? data.map((res) => ({
    id: res.id,
    propertyId: res.property_id,
    userId: res.user_id || undefined,
    startDate: new Date(res.start_date),
    endDate: new Date(res.end_date),
    platform: res.platform as any,
    source: res.source as any,
    icalUrl: res.ical_url || undefined,
    notes: res.notes || undefined,
    createdAt: new Date(res.created_at)
  })) : [];
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
  
  return data ? data.map((res) => ({
    id: res.id,
    propertyId: res.property_id,
    userId: res.user_id || undefined,
    startDate: new Date(res.start_date),
    endDate: new Date(res.end_date),
    platform: res.platform as any,
    source: res.source as any,
    icalUrl: res.ical_url || undefined,
    notes: res.notes || undefined,
    createdAt: new Date(res.created_at)
  })) : [];
};
