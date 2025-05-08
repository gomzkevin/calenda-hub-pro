
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle function invocation
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get Supabase connection from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse the request body
    const { email, password, name, propertyIds, requestingUserId } = await req.json();
    
    console.log(`Creating user: ${email}, requested by: ${requestingUserId}`);
    console.log(`Selected property IDs: ${propertyIds ? propertyIds.length : 0} properties selected`);
    
    // Verify that the requesting user exists and is an admin
    const { data: requestingUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, operator_id")
      .eq("id", requestingUserId)
      .single();
      
    if (profileError || !requestingUserProfile) {
      console.error("Error fetching requesting user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Not authorized to create users" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (requestingUserProfile.role !== 'admin') {
      console.error("Non-admin user tried to create a user");
      return new Response(
        JSON.stringify({ error: "Only admins can create users" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 1. Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`User created with ID: ${authData.user.id}`);

    // 2. Update the profile that's automatically created to include the operator_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        name,
        operator_id: requestingUserProfile.operator_id,
        role: 'user' // Default all new users to 'user' role
      })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Profile updated for user: ${authData.user.id} with operator_id: ${requestingUserProfile.operator_id}`);

    // 3. If property IDs were provided, create access records
    if (propertyIds && propertyIds.length > 0) {
      console.log(`Creating access for properties: ${propertyIds.join(", ")}`);
      
      const accessRecords = propertyIds.map(propertyId => ({
        user_id: authData.user.id,
        property_id: propertyId,
        created_by: requestingUserId
      }));
      
      const { error: accessError } = await supabase
        .from("user_property_access")
        .insert(accessRecords);

      if (accessError) {
        console.error("Error creating property access:", accessError);
      } else {
        console.log(`Created ${propertyIds.length} property access records`);
      }
    } else {
      console.log("No properties selected, skipping property access creation");
    }

    // 4. Get the updated profile
    const { data: profile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileFetchError) {
      console.error("Error fetching created profile:", profileFetchError);
      // Return success anyway, but without the full profile
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: authData.user.id,
            email: authData.user.email 
          } 
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the created user profile
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: profile.id,
          operatorId: profile.operator_id || '',
          name: profile.name,
          email: profile.email,
          role: profile.role,
          active: profile.active,
          createdAt: profile.created_at
        }
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
