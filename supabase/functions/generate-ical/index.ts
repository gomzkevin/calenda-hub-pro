
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "text/calendar; charset=utf-8",
  "Content-Disposition": "attachment; filename=calendar.ics"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get property_id from the URL query parameters
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    const token = url.searchParams.get("token");

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "Property ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key for database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token is valid for this property
    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("ical_token")
      .eq("id", propertyId)
      .single();

    if (propertyError || !propertyData) {
      console.error("Error fetching property:", propertyError);
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (propertyData.ical_token !== token) {
      console.error("Invalid token provided:", token, "Expected:", propertyData.ical_token);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch manual reservations for the specified property
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("*")
      .eq("property_id", propertyId)
      .eq("source", "Manual")  // Only include manual reservations
      .neq("status", "Blocked") // Exclude blocked periods
      .order("start_date", { ascending: true });

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch reservations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate iCal content
    const icalContent = generateICalContent(reservations, propertyId);

    // Return the iCal file
    return new Response(icalContent, { headers: corsHeaders });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Generate iCal content according to RFC 5545
 */
function generateICalContent(reservations: any[], propertyId: string): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  
  // Start building the iCal content
  let icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Booking Calendar//Property " + propertyId + "//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n") + "\r\n";

  // Add each reservation as an event
  for (const reservation of reservations) {
    // Format dates to iCal format (YYYYMMDDTHHMMSSZ)
    const startDate = formatDateForICal(new Date(reservation.start_date));
    
    // For the end date, we need to use the checkout date
    // iCal uses exclusive end dates, so no need to add a day
    const endDate = formatDateForICal(new Date(reservation.end_date));
    
    // Create a unique ID for the event
    const uid = `reservation-${reservation.id}@property-${propertyId}`;
    
    // Add the event to the calendar
    icalContent += [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:Reservation${reservation.guest_name ? ` - ${reservation.guest_name}` : ""}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE", // Shows as busy time
      `DESCRIPTION:Reservation ID: ${reservation.id}${reservation.notes ? `\\n${reservation.notes.replace(/\n/g, "\\n")}` : ""}`,
      "END:VEVENT",
    ].join("\r\n") + "\r\n";
  }

  // Close the calendar
  icalContent += "END:VCALENDAR\r\n";
  
  return icalContent;
}

/**
 * Format a date for iCal format (YYYYMMDD)
 */
function formatDateForICal(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  
  return `${year}${month}${day}`;
}
