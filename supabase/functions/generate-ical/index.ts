
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Reservation = {
  id: string;
  start_date: string;
  end_date: string;
  guest_name: string | null;
  status: string | null;
  notes: string | null;
  source: string;
  platform: string;
};

type Property = {
  id: string;
  name: string;
  ical_token: string;
  internal_code: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    
    console.log("Request path:", path);
    
    // Extract token from path
    let token = null;
    
    if (path.endsWith('.ics')) {
      // Format: /generate-ical/TOKEN.ics
      const segments = path.split('/');
      const filename = segments[segments.length - 1];
      token = filename.replace('.ics', '');
      
      console.log(`Extracted token from path: ${token}`);
    }
    
    // Fallback to query parameter if path-based token is not found
    if (!token) {
      token = url.searchParams.get('token');
      console.log(`Using query parameter token: ${token}`);
    }

    if (!token) {
      console.error('No token provided in URL');
      return new Response(
        JSON.stringify({ error: 'Token requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find property by token
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, ical_token, internal_code')
      .eq('ical_token', token)
      .single();

    if (propertyError || !property) {
      console.error('Property not found for token:', token, propertyError);
      return new Response(
        JSON.stringify({ error: 'Propiedad no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found property with id ${property.id} for token ${token}`);

    // Fetch ALL reservations for the property (not just manual ones)
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, start_date, end_date, guest_name, status, notes, source, platform')
      .eq('property_id', property.id)
      .order('start_date', { ascending: true });

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener reservaciones' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${reservations?.length || 0} reservations for property ${property.id}`);

    // Generate iCal content in standard format
    const icalContent = generateICalContent(property, reservations || []);

    // Return iCal file
    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${property.internal_code}.ics"`,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateICalContent(property: Property, reservations: Reservation[]): string {
  const now = new Date().toISOString().replace(/[-:.]/g, '');
  const prodId = `-//Alanto Property Manager//Property ${property.internal_code}//ES`;
  
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Add each reservation as an event with standard format
  for (const reservation of reservations) {
    // Format dates properly for iCalendar - must be in YYYYMMDD format
    const startDate = reservation.start_date.replace(/-/g, '');
    
    // For iCalendar, the end date is exclusive, so we don't need to adjust it
    const endDate = reservation.end_date.replace(/-/g, '');
    
    // Create a clean summary from the guest name or a default
    const summary = reservation.guest_name 
      ? `Reservation: ${reservation.guest_name}` 
      : `${reservation.platform} Reservation`;
    
    // Create an organized description with all relevant details
    let description = `Platform: ${reservation.platform}\nSource: ${reservation.source}`;
    if (reservation.status) description += `\nStatus: ${reservation.status}`;
    if (reservation.notes) description += `\nNotes: ${reservation.notes}`;
    
    // Ensure description is properly escaped for iCalendar format
    const escapedDescription = description
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
    
    // Create a unique identifier for the event
    const uid = `${reservation.id}@${property.internal_code.replace(/\s+/g, '-')}`;
    
    // Add this event to the calendar
    icalContent = icalContent.concat([
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${escapedDescription}`,
      'TRANSP:OPAQUE',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT'
    ]);
  }

  icalContent.push('END:VCALENDAR');
  
  // Ensure proper line endings according to RFC 5545
  return icalContent.join('\r\n');
}
