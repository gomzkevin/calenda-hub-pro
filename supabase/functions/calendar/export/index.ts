
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { format, parseISO } from "https://esm.sh/date-fns@3.6.0";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to escape special characters in iCal
const escapeIcalText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

// Function to format dates for iCal (YYYYMMDD format)
const formatIcalDate = (date: Date): string => {
  return format(date, 'yyyyMMdd');
};

// Helper function to generate a unique UID for each event
const generateUid = (reservationId: string, domain: string = 'alanto.co'): string => {
  return `${reservationId}@${domain}`;
};

// Helper function to query reservations for a property
const getReservationsForProperty = async (
  supabase: any,
  propertyId: string
): Promise<any[]> => {
  console.log(`Fetching reservations for property: ${propertyId}`);
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date', { ascending: true });
  
  if (error) {
    console.error("Error fetching reservations:", error);
    throw error;
  }
  
  console.log(`Found ${data?.length || 0} reservations`);
  return data || [];
};

// Helper function to get property by token
const getPropertyByToken = async (
  supabase: any,
  token: string
): Promise<any> => {
  console.log(`Looking up property with token: ${token}`);
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('ical_token', token)
    .single();
  
  if (error) {
    console.error("Error fetching property by token:", error);
    throw error;
  }
  
  console.log(`Found property: ${data?.name || 'Unknown'} (ID: ${data?.id || 'N/A'})`);
  return data;
};

// Generate iCal feed from reservations
const generateIcalFeed = (
  reservations: any[],
  propertyName: string
): string => {
  const now = new Date();
  const dtstamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alanto//PropertyManagement//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(propertyName)} - Reservations`,
  ];
  
  // Add events for each reservation
  reservations.forEach(reservation => {
    // Convert dates
    const startDate = new Date(reservation.start_date);
    const endDate = new Date(reservation.end_date);
    
    // Skip if invalid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn(`Skipping reservation with invalid dates: ${reservation.id}`);
      return;
    }
    
    // Determine summary text based on available data
    let summary = 'Reservado';
    if (reservation.guest_name) {
      summary = `Reservado - ${reservation.guest_name}`;
    } else if (reservation.platform) {
      summary = `Reservado - ${reservation.platform}`;
    } else if (reservation.status === 'Blocked') {
      summary = 'Bloqueado';
    }
    
    // Create the event
    ical = ical.concat([
      'BEGIN:VEVENT',
      `UID:${generateUid(reservation.id)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${formatIcalDate(startDate)}`,
      `DTEND;VALUE=DATE:${formatIcalDate(endDate)}`,
      `SUMMARY:${escapeIcalText(summary)}`,
      'END:VEVENT'
    ]);
  });
  
  // Close the calendar
  ical.push('END:VCALENDAR');
  
  // Join all lines and return
  return ical.join('\r\n');
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Extract token from URL
    const url = new URL(req.url);
    let token = url.searchParams.get('t');
    
    // If not in query params, check path (for /<token>.ics pattern)
    if (!token) {
      const pathParts = url.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      if (lastPart && lastPart.endsWith('.ics')) {
        token = lastPart.replace('.ics', '');
      }
    }
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get property by token
    const property = await getPropertyByToken(supabase, token);
    
    if (!property) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Get reservations for the property
    const reservations = await getReservationsForProperty(supabase, property.id);
    
    // Generate iCal feed
    const icalContent = generateIcalFeed(reservations, property.name);
    
    // Return the iCal feed
    return new Response(icalContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${property.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_calendar.ics"`,
      }
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
