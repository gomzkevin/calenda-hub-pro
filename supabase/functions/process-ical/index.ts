
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as ical from "npm:ical@0.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  icalUrl: string;
}

interface AirbnbAdditionalInfo {
  phoneLastDigits?: string;
  reservationUrl?: string;
}

interface VrboAdditionalInfo {
  guestName?: string;
}

interface BookingAdditionalInfo {
  // Additional Booking.com specific data
}

interface Reservation {
  checkIn: string;
  checkOut: string;
  platform: string;
  status: string;
  reservationId: string;
  additionalInfo?: AirbnbAdditionalInfo | VrboAdditionalInfo | BookingAdditionalInfo;
}

interface ResponseData {
  reservations: Reservation[];
  metadata: {
    totalReservations: number;
    calendarSource: string;
    processedAt: string;
  };
}

function detectPlatform(icalData: string): string {
  if (icalData.includes("PRODID:-//Airbnb Inc//")) {
    return "Airbnb";
  } else if (icalData.includes("PRODID:-//HomeAway.com") || icalData.includes("PRODID:-//VRBO//")) {
    return "Vrbo";
  } else if (icalData.includes("PRODID:-//admin.booking.com")) {
    return "Booking";
  } else {
    return "Other";
  }
}

function extractAirbnbInfo(event: any): Reservation {
  const uid = event.uid || "";
  let reservationId = "";
  let reservationUrl = "";
  let phoneLastDigits = "";
  
  // Extract reservation ID from URL in description if available
  if (event.description) {
    const urlMatch = event.description.match(/Reservation URL: (https:\/\/www\.airbnb\.com\/hosting\/reservations\/details\/([A-Z0-9]+))/);
    if (urlMatch && urlMatch[1] && urlMatch[2]) {
      reservationUrl = urlMatch[1];
      reservationId = urlMatch[2];
    }
    
    // Extract phone number last digits if available
    const phoneMatch = event.description.match(/Phone Number \(Last 4 Digits\): (\d+)/);
    if (phoneMatch && phoneMatch[1]) {
      phoneLastDigits = phoneMatch[1];
    }
  }
  
  // If no reservation ID found in URL, use part of UID as fallback
  if (!reservationId && uid) {
    const uidParts = uid.split('-');
    reservationId = uidParts.length > 1 ? uidParts[1].substring(0, 10) : uid;
  }
  
  // Determine status
  let status = event.summary || "Unknown";
  if (status.includes("Not available")) {
    status = "Blocked";
  }
  
  return {
    checkIn: event.start?.toISOString().split('T')[0] || "",
    checkOut: event.end?.toISOString().split('T')[0] || "",
    platform: "Airbnb",
    status,
    reservationId,
    additionalInfo: {
      phoneLastDigits,
      reservationUrl
    }
  };
}

function extractVrboInfo(event: any): Reservation {
  const status = event.summary || "Unknown";
  let guestName = "";
  
  // Extract guest name if available (format: "Reserved - GuestName")
  const nameMatch = status.match(/Reserved - (.+)/);
  if (nameMatch && nameMatch[1]) {
    guestName = nameMatch[1];
  }
  
  return {
    checkIn: event.start?.toISOString().split('T')[0] || "",
    checkOut: event.end?.toISOString().split('T')[0] || "",
    platform: "Vrbo",
    status: status.includes("Reserved") ? "Reserved" : (status.includes("Blocked") ? "Blocked" : status),
    reservationId: event.uid || "",
    additionalInfo: {
      guestName
    }
  };
}

function extractBookingInfo(event: any): Reservation {
  const uid = event.uid || "";
  let reservationId = uid.split('@')[0] || uid;
  
  return {
    checkIn: event.start?.toISOString().split('T')[0] || "",
    checkOut: event.end?.toISOString().split('T')[0] || "",
    platform: "Booking",
    status: event.summary || "Unknown",
    reservationId
  };
}

function extractOtherPlatformInfo(event: any, platform: string): Reservation {
  return {
    checkIn: event.start?.toISOString().split('T')[0] || "",
    checkOut: event.end?.toISOString().split('T')[0] || "",
    platform,
    status: event.summary || "Unknown",
    reservationId: event.uid || ""
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[PROCESS-ICAL] Function started");
    
    // Parse request body
    let body: RequestBody;
    try {
      body = await req.json();
      console.log("[PROCESS-ICAL] Request body:", JSON.stringify(body));
    } catch (parseError) {
      console.error("[PROCESS-ICAL] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { icalUrl } = body;

    if (!icalUrl) {
      console.error("[PROCESS-ICAL] Missing required parameter: icalUrl");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: icalUrl" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESS-ICAL] Fetching iCal data from: ${icalUrl}`);

    // Fetch the iCal data with a timeout to prevent hanging requests
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
      
      const response = await fetch(icalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PropertyManager/1.0)'
        },
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[PROCESS-ICAL] Fetch response status: ${response.status}`);
      
      if (!response.ok) {
        const errorMessage = `Failed to fetch iCal data: ${response.statusText} (${response.status})`;
        console.error(errorMessage);
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const icalData = await response.text();
      console.log(`[PROCESS-ICAL] Successfully fetched iCal data, length: ${icalData.length} characters`);
      
      if (icalData.length < 10) {
        console.error("[PROCESS-ICAL] Received empty or very short iCal data");
        return new Response(
          JSON.stringify({ error: "Received empty or invalid iCal data" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Detect platform based on iCal data
      const platform = detectPlatform(icalData);
      console.log(`[PROCESS-ICAL] Detected platform: ${platform}`);
      
      // Parse the iCal data
      let parsed;
      try {
        parsed = ical.parseICS(icalData);
        console.log(`[PROCESS-ICAL] Successfully parsed iCal data, found ${Object.keys(parsed).length} events`);
      } catch (parseError) {
        console.error("[PROCESS-ICAL] Error parsing iCal data:", parseError);
        return new Response(
          JSON.stringify({ error: `Failed to parse iCal data: ${parseError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const events = Object.values(parsed);
      
      console.log(`[PROCESS-ICAL] Found ${events.length} events in iCal feed`);
      
      // Filter for events that have start and end times
      const validEvents = events.filter(event => 
        event.start && event.end && event.type === 'VEVENT'
      );
      
      console.log(`[PROCESS-ICAL] Found ${validEvents.length} valid events after filtering`);
      
      // Process each event based on the platform
      const reservations: Reservation[] = validEvents.map(event => {
        if (platform === "Airbnb") {
          return extractAirbnbInfo(event);
        } else if (platform === "Vrbo") {
          return extractVrboInfo(event);
        } else if (platform === "Booking") {
          return extractBookingInfo(event);
        } else {
          return extractOtherPlatformInfo(event, platform);
        }
      });

      // Prepare response data
      const responseData: ResponseData = {
        reservations,
        metadata: {
          totalReservations: reservations.length,
          calendarSource: platform,
          processedAt: new Date().toISOString()
        }
      };

      console.log(`[PROCESS-ICAL] Successfully processed ${reservations.length} reservations from ${platform}`);
      
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (fetchError) {
      console.error("[PROCESS-ICAL] Error fetching iCal data:", fetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch iCal data: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("[PROCESS-ICAL] Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
