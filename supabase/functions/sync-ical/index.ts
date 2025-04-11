
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
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing iCal data for property ${propertyId} from ${icalUrl}`);

    // Fetch the iCal data
    const response = await fetch(icalUrl);
    if (!response.ok) {
      console.error(`Failed to fetch iCal data: ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch iCal data: ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const icalData = await response.text();
    
    // Parse the iCal data
    const parsed = parse(icalData);
    const events = Object.values(parsed);
    
    console.log(`Found ${events.length} events in iCal feed`);
    
    // Filter for events that have start and end times
    const validEvents = events.filter(event => 
      event.start && event.end && event.type === 'VEVENT'
    );
    
    console.log(`Found ${validEvents.length} valid events after filtering`);
    
    // Create Supabase client
    const supabase = supabaseClient();
    
    // Track how many events were added/updated
    let added = 0;
    let updated = 0;
    let skipped = 0;

    // Process each event
    for (const event of validEvents) {
      const eventUid = event.uid;
      const startDate = event.start.toISOString().split('T')[0];
      const endDate = event.end.toISOString().split('T')[0];
      const summary = event.summary || '';
      
      console.log(`Processing event: ${eventUid} (${startDate} to ${endDate}): ${summary}`);
      
      // Check if this event already exists in our database
      const { data: existingReservations, error: queryError } = await supabase
        .from("reservations")
        .select("id")
        .eq("property_id", propertyId)
        .eq("ical_url", icalUrl)
        .eq("external_id", eventUid);
      
      if (queryError) {
        console.error("Error querying existing reservations:", queryError);
        skipped++;
        continue;
      }
      
      if (existingReservations && existingReservations.length > 0) {
        // Update existing reservation
        console.log(`Updating existing reservation: ${existingReservations[0].id}`);
        
        const { error: updateError } = await supabase
          .from("reservations")
          .update({
            start_date: startDate,
            end_date: endDate,
            notes: summary,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingReservations[0].id);
        
        if (updateError) {
          console.error("Error updating reservation:", updateError);
          skipped++;
        } else {
          updated++;
        }
      } else {
        // Insert new reservation
        console.log(`Inserting new reservation for property ${propertyId}`);
        
        const { error: insertError } = await supabase
          .from("reservations")
          .insert({
            property_id: propertyId,
            start_date: startDate,
            end_date: endDate,
            platform: platform,
            source: "iCal",
            ical_url: icalUrl,
            notes: summary,
            external_id: eventUid
          });
        
        if (insertError) {
          console.error("Error inserting reservation:", insertError);
          console.error("Error details:", JSON.stringify(insertError));
          skipped++;
        } else {
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
      console.error("Error updating iCal link last_synced:", updateLinkError);
    }

    console.log(`Sync complete. Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);

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
  } catch (error) {
    console.error("Error in sync-ical function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
