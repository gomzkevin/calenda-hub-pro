
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
 * Process an iCal link to fetch latest reservations without storing in database
 */
export const processICalLink = async (icalUrl: string): Promise<{
  reservations: any[];
  metadata: {
    totalReservations: number;
    calendarSource: string;
    processedAt: string;
  };
}> => {
  try {
    console.log("Llamando a process-ical function con URL:", icalUrl);
    
    if (!icalUrl) {
      console.error("URL de iCal no proporcionada");
      throw new Error("URL de iCal no proporcionada");
    }
    
    // Encode the URL to handle special characters
    const encodedUrl = encodeURIComponent(icalUrl);
    
    // Importante: Aquí hacemos una llamada POST con la URL en el cuerpo
    const { data, error } = await supabase.functions.invoke('process-ical', {
      method: 'POST',
      body: { icalUrl: icalUrl }
    });
    
    if (error) {
      console.error("Error processing iCal:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No se recibieron datos de la función process-ical");
      throw new Error("No se recibieron datos del calendario");
    }
    
    console.log("Respuesta de process-ical:", data);
    
    // Guardar los datos en sessionStorage para mantenerlos temporalmente
    sessionStorage.setItem(`ical_data_${icalUrl}`, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error("Error processing iCal link:", error);
    throw error;
  }
};

/**
 * Get cached iCal data if available
 */
export const getCachedICalData = (icalUrl: string): any => {
  try {
    const cachedData = sessionStorage.getItem(`ical_data_${icalUrl}`);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error("Error retrieving cached iCal data:", error);
    return null;
  }
};

/**
 * Update the lastSynced timestamp for an iCal link
 */
export const updateICalLinkLastSynced = async (icalLinkId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("ical_links")
      .update({ last_synced: new Date().toISOString() })
      .eq("id", icalLinkId);
    
    if (error) {
      console.error("Error updating iCal link last_synced timestamp:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error updating iCal link:", error);
    throw error;
  }
};

/**
 * Store reservation data in the database
 */
export const storeReservations = async (
  propertyId: string, 
  platform: string, 
  icalUrl: string, 
  reservations: any[]
): Promise<{
  added: number;
  updated: number;
  skipped: number;
}> => {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  
  try {
    console.log(`Almacenando ${reservations.length} reservaciones para la propiedad ${propertyId}`);
    
    // Normalize platform name to ensure it matches the database constraint
    // Make sure platform is one of: 'Airbnb', 'Booking', 'Vrbo', 'Other'
    let normalizedPlatform = platform;
    if (!['Airbnb', 'Booking', 'Vrbo', 'Other'].includes(normalizedPlatform)) {
      // If platform is not one of the allowed values, default to 'Other'
      console.warn(`Platform '${platform}' not recognized, using 'Other' instead`);
      normalizedPlatform = 'Other';
    }
    
    // Process each reservation
    for (const reservation of reservations) {
      // Ensure we have the required data
      if (!reservation.checkIn || !reservation.checkOut) {
        console.warn("Skipping reservation with missing dates:", reservation);
        skipped++;
        continue;
      }
      
      const externalId = reservation.reservationId || reservation.uid || '';
      const startDate = reservation.checkIn;
      const endDate = reservation.checkOut;
      
      // Prepare notes with additional information
      let notes = reservation.status || '';
      if (platform === 'Airbnb' && reservation.additionalInfo) {
        if (reservation.additionalInfo.reservationUrl) {
          notes += `\nReservation URL: ${reservation.additionalInfo.reservationUrl}`;
        }
        if (reservation.additionalInfo.phoneLastDigits) {
          notes += `\nPhone: XXXX-XXXX-${reservation.additionalInfo.phoneLastDigits}`;
        }
      } else if (platform === 'Vrbo' && reservation.additionalInfo?.guestName) {
        notes += `\nGuest: ${reservation.additionalInfo.guestName}`;
      }
      
      // Check if this reservation already exists
      const { data: existingReservations, error: queryError } = await supabase
        .from("reservations")
        .select("id")
        .eq("property_id", propertyId)
        .eq("external_id", externalId);
      
      if (queryError) {
        console.error("Error checking for existing reservation:", queryError);
        skipped++;
        continue;
      }
      
      if (existingReservations && existingReservations.length > 0) {
        // Update existing reservation
        const { error: updateError } = await supabase
          .from("reservations")
          .update({
            start_date: startDate,
            end_date: endDate,
            notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingReservations[0].id);
        
        if (updateError) {
          console.error("Error updating reservation:", updateError);
          skipped++;
        } else {
          console.log(`Actualizada reservación: ${startDate} - ${endDate}`);
          updated++;
        }
      } else {
        // Insert new reservation
        const reservationData = {
          property_id: propertyId,
          start_date: startDate,
          end_date: endDate,
          platform: normalizedPlatform,  // Use normalized platform name
          source: "iCal",
          ical_url: icalUrl,
          notes: notes,
          external_id: externalId
        };
        
        console.log("Insertando nueva reservación:", reservationData);
        
        const { error: insertError } = await supabase
          .from("reservations")
          .insert(reservationData);
        
        if (insertError) {
          console.error("Error inserting reservation:", insertError);
          skipped++;
        } else {
          console.log(`Añadida nueva reservación: ${startDate} - ${endDate}`);
          added++;
        }
      }
    }
    
    console.log(`Resultados de sincronización: ${added} añadidas, ${updated} actualizadas, ${skipped} omitidas`);
    return { added, updated, skipped };
  } catch (error) {
    console.error("Error storing reservations:", error);
    throw error;
  }
};

/**
 * Sync an iCal link to fetch latest reservations and store in database
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
    console.log("Iniciando sincronización para:", icalLink.url);
    
    if (!icalLink || !icalLink.url) {
      return {
        success: false,
        error: "Enlace iCal inválido o sin URL"
      };
    }
    
    // 1. Process the iCal data to get reservations
    const processingResult = await processICalLink(icalLink.url);
    
    if (!processingResult) {
      console.error("No se recibieron datos de la función process-ical");
      return { 
        success: false, 
        error: "No se recibieron datos del calendario" 
      };
    }
    
    console.log("Datos procesados:", processingResult);
    
    // 2. Store the reservations in the database
    const storageResults = await storeReservations(
      icalLink.propertyId,
      processingResult.metadata.calendarSource,
      icalLink.url,
      processingResult.reservations
    );
    
    // 3. Update the last_synced timestamp
    await updateICalLinkLastSynced(icalLink.id);
    
    return {
      success: true,
      results: {
        total: processingResult.reservations.length,
        ...storageResults
      }
    };
  } catch (error) {
    console.error("Error syncing iCal link:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
