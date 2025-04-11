
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "../_shared/supabase-client.ts";
import { parse } from "npm:ical@0.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { icalUrl, propertyId, platform, icalLinkId } = await req.json();

    if (!icalUrl || !propertyId || !platform || !icalLinkId) {
      console.error("Missing required parameters:", { icalUrl, propertyId, platform, icalLinkId });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SYNC-ICAL] Starting sync for property ${propertyId} from ${icalUrl} (platform: ${platform})`);

    // Fetch the iCal data
    try {
      const response = await fetch(icalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Lovable/1.0; +https://lovable.dev)'
        }
      });
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch iCal data: ${response.statusText} (${response.status})`;
        console.error(errorMessage);
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const icalData = await response.text();
      console.log(`[SYNC-ICAL] Successfully fetched iCal data, length: ${icalData.length} characters`);
      
      if (icalData.length < 10) {
        console.error("[SYNC-ICAL] Received empty or very short iCal data");
        return new Response(
          JSON.stringify({ error: "Received empty or invalid iCal data" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Log a snippet of the iCal data for debugging
      console.log(`[SYNC-ICAL] iCal data preview: ${icalData.substring(0, 200)}...`);
      
      // Parse the iCal data
      let parsed;
      try {
        parsed = parse(icalData);
        console.log(`[SYNC-ICAL] Successfully parsed iCal data, found ${Object.keys(parsed).length} events`);
      } catch (parseError) {
        console.error("[SYNC-ICAL] Error parsing iCal data:", parseError);
        return new Response(
          JSON.stringify({ error: `Failed to parse iCal data: ${parseError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const events = Object.values(parsed);
      
      console.log(`[SYNC-ICAL] Found ${events.length} events in iCal feed`);
      
      // Filter for events that have start and end times
      const validEvents = events.filter(event => 
        event.start && event.end && event.type === 'VEVENT'
      );
      
      console.log(`[SYNC-ICAL] Found ${validEvents.length} valid events after filtering`);
      
      // Create Supabase client
      const supabase = supabaseClient();
      
      // Track how many events were added/updated
      let added = 0;
      let updated = 0;
      let skipped = 0;

      // Process each event
      for (const event of validEvents) {
        const eventUid = event.uid;
        const summary = event.summary || '';
        const description = event.description || '';
        
        // Determine if this is a blocked date or actual reservation
        const isBlocked = summary.includes('Not available');
        
        // Extract reservation URL and phone number from description if available
        let reservationUrl = '';
        let phoneNumber = '';
        
        if (description) {
          // Extract reservation URL
          const urlMatch = description.match(/Reservation URL: (https:\/\/[^\s\n]+)/);
          if (urlMatch && urlMatch[1]) {
            reservationUrl = urlMatch[1];
          }
          
          // Extract phone number
          const phoneMatch = description.match(/Phone Number \(Last 4 Digits\): (\d+)/);
          if (phoneMatch && phoneMatch[1]) {
            phoneNumber = phoneMatch[1];
          }
        }
        
        // Ensure dates are valid
        if (!event.start || !event.end) {
          console.warn(`[SYNC-ICAL] Event ${eventUid} has invalid dates, skipping`);
          skipped++;
          continue;
        }
        
        // Format dates correctly for database
        const startDate = event.start.toISOString().split('T')[0];
        const endDate = event.end.toISOString().split('T')[0];
        
        console.log(`[SYNC-ICAL] Processing event: ${eventUid} (${startDate} to ${endDate}): ${summary}`);
        if (reservationUrl) {
          console.log(`[SYNC-ICAL] Reservation URL: ${reservationUrl}`);
        }
        
        // Prepare notes with additional information
        let notes = summary;
        if (reservationUrl || phoneNumber) {
          notes = `${summary}\n`;
          if (reservationUrl) notes += `Reservation URL: ${reservationUrl}\n`;
          if (phoneNumber) notes += `Phone: XXXX-XXXX-${phoneNumber}`;
        }
        
        // Check if this event already exists in our database
        const { data: existingReservations, error: queryError } = await supabase
          .from("reservations")
          .select("id")
          .eq("property_id", propertyId)
          .eq("external_id", eventUid);
        
        if (queryError) {
          console.error("[SYNC-ICAL] Error querying existing reservations:", queryError);
          skipped++;
          continue;
        }
        
        if (existingReservations && existingReservations.length > 0) {
          // Update existing reservation
          console.log(`[SYNC-ICAL] Updating existing reservation: ${existingReservations[0].id}`);
          
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
            console.error("[SYNC-ICAL] Error updating reservation:", updateError);
            skipped++;
          } else {
            updated++;
          }
        } else {
          // Insert new reservation
          console.log(`[SYNC-ICAL] Inserting new reservation for property ${propertyId}`);
          
          // Prepare the reservation data
          const reservationData = {
            property_id: propertyId,
            start_date: startDate,
            end_date: endDate,
            platform: platform,
            source: "iCal",
            ical_url: icalUrl,
            notes: notes,
            external_id: eventUid
          };
          
          console.log("[SYNC-ICAL] Reservation data:", JSON.stringify(reservationData));
          
          const { data: insertedData, error: insertError } = await supabase
            .from("reservations")
            .insert(reservationData)
            .select();
          
          if (insertError) {
            console.error("[SYNC-ICAL] Error inserting reservation:", insertError);
            console.error("[SYNC-ICAL] Error details:", JSON.stringify(insertError));
            skipped++;
          } else {
            console.log(`[SYNC-ICAL] Successfully inserted reservation: ${insertedData && insertedData[0] ? insertedData[0].id : 'unknown'}`);
            added++;
          }
        }
      }
      
      // Update the last_synced timestamp for the iCal link
      const { error: updateLinkError } = await supabase
        .from("ical_links")
        .update({ last_synced: new Date().toISOString() })
        .eq("id", icalLinkId);
        
      if (updateLinkError) {
        console.error("[SYNC-ICAL] Error updating iCal link last_synced:", updateLinkError);
      } else {
        console.log(`[SYNC-ICAL] Successfully updated iCal link ${icalLinkId} last_synced timestamp`);
      }

      console.log(`[SYNC-ICAL] Sync complete. Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          results: { 
            total: validEvents.length, 
            added, 
            updated, 
            skipped 
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error("[SYNC-ICAL] Error fetching iCal data:", fetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch iCal data: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("[SYNC-ICAL] Error in sync-ical function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
