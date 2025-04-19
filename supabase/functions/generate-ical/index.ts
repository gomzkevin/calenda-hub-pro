
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

    // Fetch ONLY MANUAL reservations for the property (where platform is 'Other')
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, start_date, end_date, guest_name, status, notes, source, platform')
      .eq('property_id', property.id)
      .eq('platform', 'Other')
      .order('start_date', { ascending: true });

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener reservaciones' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${reservations?.length || 0} manual reservations for property ${property.id}`);

    // Generate iCal content in Airbnb format
    const icalContent = generateAirbnbFormatICalContent(property, reservations || []);

    // Return iCal file
    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar',
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

function generateAirbnbFormatICalContent(property: Property, reservations: Reservation[]): string {
  const now = new Date().toISOString().replace(/[-:.]/g, '');
  
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Converted Calendar//EN',
    'CALSCALE:GREGORIAN'
  ];

  // Add each reservation as an event with Airbnb format
  for (const reservation of reservations) {
    const startDate = reservation.start_date.replace(/-/g, '');
    const endDate = reservation.end_date.replace(/-/g, '');
    
    icalContent = icalContent.concat([
      'BEGIN:VEVENT',
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      'SUMMARY:Airbnb (Not available)',
      `UID:${reservation.id}@${property.internal_code}`,
      'END:VEVENT'
    ]);
  }

  icalContent.push('END:VCALENDAR');
  return icalContent.join('\r\n');
}

