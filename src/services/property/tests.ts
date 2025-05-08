
import { supabase } from "@/integrations/supabase/client";
import { getUserPropertyAccess } from "@/services/userService";

/**
 * Función de diagnóstico para comprobar si hay problemas de permisos
 */
export const debugPropertyAccess = async (userId: string): Promise<{
  userRole?: string,
  userProperties: string[],
  directAccessTest: boolean,
  policiesTest?: boolean,
  error?: string
}> => {
  try {
    // 1. Verificar el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    
    if (userError) {
      return { 
        userRole: undefined,
        userProperties: [],
        directAccessTest: false,
        error: `Error getting user role: ${userError.message}`
      };
    }
    
    // 2. Obtener propiedades asignadas al usuario
    const userProperties = await getUserPropertyAccess(userId);
    
    // 3. Probar acceso directo a una propiedad (para verificar RLS)
    let directAccessResult = false;
    let policiesTestResult = false;
    
    if (userProperties.length > 0) {
      // 3.1 Probar una propiedad asignada
      const { data, error } = await supabase
        .from("properties")
        .select("id")
        .eq("id", userProperties[0])
        .maybeSingle();
      
      directAccessResult = !error && !!data;
      
      // 3.2 Probar acceso a una propiedad no asignada
      if (directAccessResult && userData?.role !== 'admin') {
        // Intentamos obtener una propiedad que no debería ser accesible para verificar RLS
        const { data: allProps } = await supabase
          .from("properties")
          .select("id")
          .not("id", "in", `(${userProperties.join(',')})`);
          
        // Si es un usuario regular y no puede ver propiedades no asignadas, la política funciona
        policiesTestResult = allProps?.length === 0;
      } else if (userData?.role === 'admin') {
        // Para administradores, deberían poder ver todas las propiedades
        policiesTestResult = true;
      }
    }
    
    return {
      userRole: userData?.role,
      userProperties,
      directAccessTest: directAccessResult,
      policiesTest: policiesTestResult
    };
  } catch (error: any) {
    return {
      userRole: undefined,
      userProperties: [],
      directAccessTest: false,
      error: error.message || "Unknown error"
    };
  }
};

/**
 * Función para depurar SQL de la política RLS usando una edge function
 */
export const getRlsPolicyDebugInfo = async () => {
  try {
    // Llamar a la edge function en vez de usar RPC directamente
    const { data, error } = await supabase.functions.invoke('debug_rls_policy_info', {
      body: { table_name: 'properties' }
    });
    
    if (error) {
      console.error("Error debugging RLS policy:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Error executing debug function:", error);
    return { success: false, error: error.message };
  }
};
