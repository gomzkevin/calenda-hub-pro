
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "../../_shared/supabase-client.ts";

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
};

type Property = {
  id: string;
  name: string;
  ical_token: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const token = queryParams.get('t');

    if (!token) {
      console.error('No token provided in URL');
      return new Response(
        JSON.stringify({ error: 'Token requerido' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const supabase = supabaseClient();

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, ical_token')
      .eq('ical_token', token)
      .single();

    if (propertyError || !property) {
      console.error('Property not found for token:', token, propertyError);
      return new Response(
        JSON.stringify({ error: 'Propiedad no encontrada' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, start_date, end_date, guest_name, status')
      .eq('property_id', property.id)
      .eq('platform', 'Other')
      .order('start_date', { ascending: true });

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener reservaciones' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const icalContent = generateICalContent(property, reservations || []);

    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=UTF-8',
        'Content-Disposition': `inline; filename="${property.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_calendar.ics"`,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
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

function generateICalContent(property: Property, reservations: Reservation[]): string {
  // Format current time in UTC format for DTSTAMP as required by RFC 5545
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '');
  
  // Standard iCalendar header according to RFC 5545
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alanto//Calendar Service//ES', // Neutral PRODID 
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH' // Added METHOD as per RFC 5545
  ];

  // Add each reservation as an event
  for (const reservation of reservations) {
    // Format dates properly for iCalendar (remove hyphens for VALUE=DATE format)
    const startDate = reservation.start_date.replace(/-/g, '');
    const endDate = reservation.end_date.replace(/-/g, '');
    
    // Format the summary based on reservation status and guest name
    let summary = 'CLOSED - Not available'; // Booking.com format
    if (reservation.status?.toLowerCase() !== 'blocked' && reservation.guest_name) {
      summary = `Reserved - ${reservation.guest_name}`; // VRBO format
    }

    // Create a proper UID for the event (using the reservation ID but making it look like a proper UID)
    const uid = `${reservation.id}@alanto.calendar`;

    icalContent = icalContent.concat([
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${summary}`,
      'END:VEVENT'
    ]);
  }

  icalContent.push('END:VCALENDAR');
  
  // Ensure proper line endings as required by RFC 5545 (\r\n)
  return icalContent.join('\r\n');
}
