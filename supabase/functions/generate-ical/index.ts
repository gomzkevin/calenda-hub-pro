
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
    const path = url.pathname;
    let token = null;
    
    // Support both formats: /TOKEN.ics and /v1/export?t=TOKEN
    if (path.endsWith('.ics')) {
      // Format: /TOKEN.ics
      const segments = path.split('/');
      const filename = segments[segments.length - 1];
      token = filename.replace('.ics', '');
    } else if (path.includes('/export') && url.searchParams.has('t')) {
      // Format: /v1/export?t=TOKEN (Booking.com style)
      token = url.searchParams.get('t');
    }

    if (!token) {
      console.error('No token provided in URL');
      return new Response(
        JSON.stringify({ error: 'Token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, ical_token')
      .eq('ical_token', token)
      .single();

    if (propertyError || !property) {
      console.error('Property not found for token:', token, propertyError);
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ error: 'Error fetching reservations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const icalContent = generateICalContent(property, reservations || []);

    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${token}.ics"`,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateICalContent(property: Property, reservations: Reservation[]): string {
  const now = new Date().toISOString().replace(/[-:.]/g, '').replace(/\.\d+Z$/, 'Z');
  
  // Create iCal content that works with multiple platforms
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PropertyManager//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Add each reservation as an event
  for (const reservation of reservations) {
    // Format dates to YYYYMMDD format (no dashes)
    const startDate = reservation.start_date.replace(/-/g, '');
    const endDate = reservation.end_date.replace(/-/g, '');
    
    // Format the summary based on status and guest name
    let summary = 'CLOSED - Not available';
    if (reservation.status?.toLowerCase() !== 'blocked' && reservation.guest_name) {
      summary = `Reserved - ${reservation.guest_name}`;
    }

    icalContent = icalContent.concat([
      'BEGIN:VEVENT',
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `UID:${reservation.id}@propertymanager.com`,
      `SUMMARY:${summary}`,
      'END:VEVENT'
    ]);
  }

  icalContent.push('END:VCALENDAR');
  return icalContent.join('\r\n');
}
