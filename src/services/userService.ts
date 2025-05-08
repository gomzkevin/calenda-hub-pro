
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

/**
 * Get all users with their profiles
 * Los administradores pueden ver a todos los usuarios de su operador
 * Los usuarios normales solo ven su propio perfil
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    // Obtener el usuario autenticado actual
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      console.error("Error obteniendo usuario autenticado:", authError);
      return [];
    }

    // Obtener el perfil del usuario actual para saber su rol y operador_id
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, operator_id")
      .eq("id", currentUser.id)
      .single();

    if (profileError || !currentProfile) {
      console.error("Error obteniendo perfil del usuario actual:", profileError);
      return [];
    }

    console.log("Perfil del usuario actual:", currentProfile);

    // Consulta base para perfiles
    let query = supabase.from("profiles").select("*");
    
    if (currentProfile.role === 'admin') {
      // Los administradores pueden ver todos los usuarios de su operador
      if (currentProfile.operator_id) {
        query = query.eq("operator_id", currentProfile.operator_id);
        console.log(`Admin: Buscando usuarios con operator_id=${currentProfile.operator_id}`);
      } else {
        console.error("Error: Admin sin operator_id asignado");
      }
    } else {
      // Los usuarios normales solo pueden ver su propio perfil
      query = query.eq("id", currentUser.id);
      console.log("Usuario regular: Mostrando solo su perfil");
    }

    // Ejecutar la consulta
    const { data: profiles, error: fetchError } = await query;
    
    if (fetchError) {
      console.error("Error obteniendo perfiles:", fetchError);
      return [];
    }
    
    console.log(`Encontrados ${profiles?.length || 0} perfiles de usuario`);
    
    if (profiles && profiles.length > 0) {
      console.log("Primer perfil encontrado:", profiles[0]);
    }
    
    // Transformar los perfiles al formato User
    return (profiles || []).map((profile) => ({
      id: profile.id,
      operatorId: profile.operator_id || '',
      name: profile.name,
      email: profile.email,
      role: profile.role as 'admin' | 'user',
      active: profile.active,
      createdAt: new Date(profile.created_at)
    }));
  } catch (error) {
    console.error("Error inesperado en getUsers:", error);
    return [];
  }
};

/**
 * Get current logged in user with profile data
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (error || !profile) {
      console.error("Error obteniendo perfil de usuario:", error);
      return null;
    }
    
    return {
      id: profile.id,
      operatorId: profile.operator_id || '',
      name: profile.name,
      email: profile.email,
      role: profile.role as 'admin' | 'user',
      active: profile.active,
      createdAt: new Date(profile.created_at)
    };
  } catch (error) {
    console.error("Error en getCurrentUser:", error);
    return null;
  }
};

/**
 * Create a new user with specified properties access
 */
export const createUser = async (
  email: string,
  password: string,
  name: string,
  propertyIds: string[] = []
): Promise<User> => {
  // Obtener el usuario actual
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) {
    throw new Error("Usuario no autenticado");
  }
  
  console.log("Llamando a create-user con propiedades seleccionadas:", propertyIds);
  
  // Llamar a la función Edge para crear el usuario
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: {
      email,
      password,
      name,
      propertyIds,
      requestingUserId: currentUser.id
    }
  });
  
  if (error) {
    console.error("Error de la función create-user:", error);
    throw new Error(`Error al crear usuario: ${error.message}`);
  }
  
  if (!data.success) {
    console.error("Error creando usuario:", data.error);
    throw new Error(`Error al crear usuario: ${data.error}`);
  }
  
  console.log("Usuario creado exitosamente:", data.user);
  
  return data.user;
};

/**
 * Update user property access
 */
export const updateUserPropertyAccess = async (
  userId: string,
  propertyIds: string[]
): Promise<void> => {
  // Obtener el usuario actual para registrar quién hace el cambio
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) {
    throw new Error("Usuario no autenticado");
  }

  try {
    // 1. Eliminar todos los accesos existentes para el usuario
    const { error: deleteError } = await supabase
      .from("user_property_access")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error eliminando accesos a propiedades:", deleteError);
      throw deleteError;
    }

    // 2. Crear nuevos accesos si se proporcionaron propiedades
    if (propertyIds.length > 0) {
      const { error: insertError } = await supabase
        .from("user_property_access")
        .insert(
          propertyIds.map(propertyId => ({
            user_id: userId,
            property_id: propertyId,
            created_by: currentUser.id
          }))
        );

      if (insertError) {
        console.error("Error creando accesos a propiedades:", insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error("Error en updateUserPropertyAccess:", error);
    throw error;
  }
};

/**
 * Get property access for a user
 */
export const getUserPropertyAccess = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("user_property_access")
      .select("property_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error obteniendo accesos a propiedades:", error);
      throw error;
    }

    return data.map(access => access.property_id);
  } catch (error) {
    console.error("Error en getUserPropertyAccess:", error);
    return [];
  }
};

/**
 * Update user active status
 */
export const updateUserStatus = async (userId: string, active: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ active })
      .eq("id", userId);

    if (error) {
      console.error("Error actualizando estado del usuario:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error en updateUserStatus:", error);
    throw error;
  }
};
