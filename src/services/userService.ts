import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

/**
 * Get all users with their profiles
 */
export const getUsers = async (): Promise<User[]> => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
  
  return profiles.map((profile) => ({
    id: profile.id,
    operatorId: profile.operator_id || '',
    name: profile.name,
    email: profile.email,
    role: profile.role as 'admin' | 'user',
    active: profile.active,
    createdAt: new Date(profile.created_at)
  }));
};

/**
 * Get current logged in user with profile data
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (error || !profile) {
    console.error("Error fetching user profile:", error);
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
  try {
    // Primero, intentamos obtener el usuario actual para verificar sus permisos
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    console.log("Usuario actual:", currentUser);
    console.log("Email del usuario actual:", currentUser.email);

    // 1. Crear el usuario usando el método admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error("Error detallado al crear usuario:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("No se devolvió ningún usuario al crear");
    }

    // 2. Obtener el perfil que fue creado automáticamente por el trigger
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("Error al obtener el perfil:", profileError);
      throw profileError;
    }

    // 3. Si se proporcionaron IDs de propiedades, crear registros de acceso
    if (propertyIds.length > 0) {
      const { error: accessError } = await supabase
        .from("user_property_access")
        .insert(
          propertyIds.map(propertyId => ({
            user_id: authData.user.id,
            property_id: propertyId,
            created_by: currentUser.id
          }))
        );

      if (accessError) {
        console.error("Error al crear accesos a propiedades:", accessError);
        throw accessError;
      }
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
    console.error("Error completo al crear usuario:", error);
    throw error;
  }
};

/**
 * Update user property access
 */
export const updateUserPropertyAccess = async (
  userId: string,
  propertyIds: string[]
): Promise<void> => {
  // 1. Delete all existing access records for the user
  const { error: deleteError } = await supabase
    .from("user_property_access")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Error deleting property access:", deleteError);
    throw deleteError;
  }

  // 2. Create new access records if properties were provided
  if (propertyIds.length > 0) {
    // Obtener el usuario actual de manera async
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;
    
    const { error: insertError } = await supabase
      .from("user_property_access")
      .insert(
        propertyIds.map(propertyId => ({
          user_id: userId,
          property_id: propertyId,
          created_by: currentUserId
        }))
      );

    if (insertError) {
      console.error("Error creating property access:", insertError);
      throw insertError;
    }
  }
};

/**
 * Get property access for a user
 */
export const getUserPropertyAccess = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("user_property_access")
    .select("property_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user property access:", error);
    throw error;
  }

  return data.map(access => access.property_id);
};

/**
 * Update user active status
 */
export const updateUserStatus = async (userId: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};
