
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "../userService";

/**
 * Verifica si es necesario volver a cargar los permisos
 * Esta función intenta forzar una recarga de la sesión para actualizar permisos
 */
export const refreshPermissions = async (): Promise<boolean> => {
  try {
    console.log("Refreshing permissions and session...");
    
    // 1. Forzar recarga de la sesión para actualizar permisos
    const { data: session, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError) {
      console.error("Error refreshing session:", sessionError);
      return false;
    }
    
    // 2. Verificamos que la sesión tenga un token válido
    if (!session?.session?.access_token) {
      console.error("No valid access token in the refreshed session");
      return false;
    }
    
    // 3. Log para debuggear
    console.log("Session refreshed successfully with new token");
    
    // 4. Pequeña pausa para permitir que el token se propague
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error("Error refreshing permissions:", error);
    return false;
  }
};

/**
 * Verifica si el usuario es admin
 */
export const isUserAdmin = async (): Promise<boolean> => {
  const currentUser = await getCurrentUser();
  return currentUser?.role === 'admin';
};

/**
 * Función importante para asegurar que los permisos del usuario se apliquen correctamente
 * Esta función ayuda a depurar y corregir problemas con RLS
 */
export const ensurePropertyAccessPermissions = async (userId: string): Promise<{
  success: boolean,
  message?: string
}> => {
  try {
    const currentUser = await getCurrentUser();
    
    // Si el usuario actual es admin, tiene todos los permisos
    if (currentUser?.role === 'admin') {
      return { success: true };
    }
    
    // Para un usuario normal, verificamos su acceso
    const { data: accessData, error: accessError } = await supabase
      .from("user_property_access")
      .select("property_id")
      .eq("user_id", userId);
      
    if (accessError) {
      console.error("Error fetching user property access:", accessError);
      return { 
        success: false, 
        message: `Error verificando permisos: ${accessError.message}` 
      };
    }
    
    // Forzamos una actualización de la sesión para que RLS funcione correctamente
    const refreshed = await refreshPermissions();
    
    return { 
      success: refreshed,
      message: refreshed 
        ? `Usuario tiene acceso a ${accessData.length} propiedades` 
        : "Error al actualizar permisos"
    };
  } catch (error: any) {
    console.error("Error ensuring property access:", error);
    return { 
      success: false,
      message: error.message || "Error desconocido al verificar permisos" 
    };
  }
};
