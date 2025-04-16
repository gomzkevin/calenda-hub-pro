
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'text/calendar',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');

    if (!propertyId) {
      return new Response('Property ID is required', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property:', propertyError);
      return new Response('Property not found', { status: 404 });
    }

    // Get manual reservations for the property
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', propertyId)
      .eq('source', 'Manual');

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return new Response('Error fetching reservations', { status: 500 });
    }

    // Generate iCal content
    let iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Alanto//Property Manager//ES',
      `X-WR-CALNAME:${property.name} - Manual Reservations`,
    ];

    // Add events for each reservation
    reservations.forEach((reservation) => {
      const summary = reservation.guest_name 
        ? `Reserved - ${reservation.guest_name}` 
        : (reservation.status === 'Blocked' ? 'Blocked' : 'Reserved');

      const description = [
        reservation.notes,
        reservation.guest_count ? `Guests: ${reservation.guest_count}` : null,
        `Status: ${reservation.status}`,
      ].filter(Boolean).join('\\n');

      iCalContent = iCalContent.concat([
        'BEGIN:VEVENT',
        `UID:${reservation.id}@alanto.app`,
        `DTSTART;VALUE=DATE:${reservation.start_date.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${reservation.end_date.replace(/-/g, '')}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT'
      ]);
    });

    iCalContent.push('END:VCALENDAR');

    return new Response(iCalContent.join('\r\n'), {
      headers: {
        ...corsHeaders,
        'Content-Disposition': `attachment; filename="${property.name}-calendar.ics"`
      }
    });

  } catch (error) {
    console.error('Error generating iCal:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
