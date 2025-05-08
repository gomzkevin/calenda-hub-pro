
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Define CORS headers para acceso desde el navegador
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Manejar la invocación de la función
serve(async (req) => {
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Obtener la conexión Supabase desde variables de entorno
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parsear el cuerpo de la solicitud
    const { email, password, name, propertyIds, requestingUserId } = await req.json();
    
    console.log(`Creando usuario: ${email}, solicitado por: ${requestingUserId}`);
    
    // Verificar que el usuario solicitante existe y es un administrador
    const { data: requestingUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, operator_id")
      .eq("id", requestingUserId)
      .single();
      
    if (profileError || !requestingUserProfile) {
      console.error("Error obteniendo perfil del usuario solicitante:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado para crear usuarios" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (requestingUserProfile.role !== 'admin') {
      console.error("Usuario no-admin intentó crear un usuario");
      return new Response(
        JSON.stringify({ success: false, error: "Solo los administradores pueden crear usuarios" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verificar que el admin tenga operator_id asignado
    console.log(`Usando operator_id del admin solicitante: ${requestingUserProfile.operator_id}`);
    if (!requestingUserProfile.operator_id) {
      console.error("Usuario admin sin operator_id - esto es un error");
      return new Response(
        JSON.stringify({ success: false, error: "Usuario admin sin operator_id" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Crear el usuario en auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error("Error creando usuario:", authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Usuario creado con ID: ${authData.user.id}`);

    // 2. Actualizar el perfil con el operator_id del admin solicitante
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        name,
        operator_id: requestingUserProfile.operator_id,
        role: 'user' // Por defecto, todos los nuevos usuarios tienen rol 'user'
      })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Error actualizando perfil:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Perfil actualizado con operator_id: ${requestingUserProfile.operator_id}`);

    // 3. Si se proporcionaron IDs de propiedades, crear registros de acceso
    if (propertyIds && propertyIds.length > 0) {
      console.log(`Creando acceso para propiedades: ${propertyIds.join(", ")}`);
      
      const accessRecords = propertyIds.map(propertyId => ({
        user_id: authData.user.id,
        property_id: propertyId,
        created_by: requestingUserId
      }));
      
      const { error: accessError } = await supabase
        .from("user_property_access")
        .insert(accessRecords);

      if (accessError) {
        console.error("Error creando acceso a propiedades:", accessError);
        // Continuar a pesar de este error, el usuario sigue creado
      }
    }

    // 4. Obtener el perfil actualizado
    const { data: profile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileFetchError) {
      console.error("Error obteniendo perfil creado:", profileFetchError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            role: 'user',
            active: true,
            operatorId: requestingUserProfile.operator_id,
            createdAt: new Date()
          } 
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Devolver el perfil de usuario creado
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
    console.error("Error inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Ocurrió un error inesperado" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
