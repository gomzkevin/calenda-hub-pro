
import { supabase } from "@/integrations/supabase/client";
import { ICalLink } from "@/types";

/**
 * Fetch all iCal links from the database
 */
export const getICalLinks = async (): Promise<ICalLink[]> => {
  const { data, error } = await supabase
    .from("ical_links")
    .select("*");
  
  if (error) {
    console.error("Error fetching iCal links:", error);
    throw error;
  }
  
  return data ? data.map((link) => ({
    id: link.id,
    propertyId: link.property_id,
    platform: link.platform as any,
    url: link.url,
    createdAt: new Date(link.created_at)
  })) : [];
};

/**
 * Fetch iCal links for a specific property
 */
export const getICalLinksForProperty = async (propertyId: string): Promise<ICalLink[]> => {
  const { data, error } = await supabase
    .from("ical_links")
    .select("*")
    .eq("property_id", propertyId);
  
  if (error) {
    console.error(`Error fetching iCal links for property ${propertyId}:`, error);
    throw error;
  }
  
  return data ? data.map((link) => ({
    id: link.id,
    propertyId: link.property_id,
    platform: link.platform as any,
    url: link.url,
    createdAt: new Date(link.created_at)
  })) : [];
};
