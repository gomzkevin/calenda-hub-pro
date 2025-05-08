
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the table name from the request
    const { table_name } = await req.json()

    // Query to get information about RLS policies
    const query = `
      SELECT 
        tablename, 
        policyname, 
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM 
        pg_policies
      WHERE 
        tablename = '${table_name}'
    `

    // Run the query
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { query })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        policies: data
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400,
      },
    )
  }
})
