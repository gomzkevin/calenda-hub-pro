
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
    lastSynced: link.last_synced ? new Date(link.last_synced) : undefined,
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
    lastSynced: link.last_synced ? new Date(link.last_synced) : undefined,
    createdAt: new Date(link.created_at)
  })) : [];
};

/**
 * Sync an iCal link to fetch latest reservations
 */
export const syncICalLink = async (icalLink: ICalLink): Promise<{
  success: boolean;
  results?: {
    total: number;
    added: number;
    updated: number;
    skipped: number;
  },
  error?: string;
}> => {
  try {
    const response = await supabase.functions.invoke('sync-ical', {
      body: {
        icalUrl: icalLink.url,
        propertyId: icalLink.propertyId,
        platform: icalLink.platform,
        icalLinkId: icalLink.id
      }
    });
    
    if (!response.data || response.error) {
      console.error("Error syncing iCal link:", response.error);
      return { success: false, error: response.error?.message || 'Error desconocido' };
    }
    
    return response.data;
  } catch (error) {
    console.error("Error syncing iCal link:", error);
    return { success: false, error: error.message };
  }
};
