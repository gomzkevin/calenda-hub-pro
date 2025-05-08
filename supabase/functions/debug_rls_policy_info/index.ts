
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
      ORDER BY 
        policyname
    `

    // Query to get current user information for debugging
    const userQuery = `
      SELECT 
        current_user, 
        current_setting('request.jwt.claims', true)::json->>'sub' as auth_user_id
    `

    // Run the queries
    const { data: policiesData, error: policiesError } = await supabaseAdmin.rpc('exec_sql', { query })
    const { data: userData, error: userError } = await supabaseAdmin.rpc('exec_sql', { query: userQuery })

    if (policiesError) throw policiesError
    if (userError) throw userError

    // Get the list of users with access to properties
    const accessQuery = `
      SELECT 
        upa.user_id, 
        p.name as user_name,
        COUNT(upa.property_id) as access_count
      FROM 
        user_property_access upa
      JOIN
        profiles p ON p.id = upa.user_id
      GROUP BY 
        upa.user_id, p.name
    `
    
    const { data: accessData, error: accessError } = await supabaseAdmin.rpc('exec_sql', { query: accessQuery })
    
    if (accessError) throw accessError

    return new Response(
      JSON.stringify({ 
        success: true, 
        policies: policiesData,
        user: userData,
        userAccess: accessData,
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
