
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

/**
 * Get all users with their profiles
 */
export const getUsers = async (): Promise<User[]> => {
  // Primero obtenemos el perfil del usuario actual para saber si es admin
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) {
    console.error("No current user found");
    return [];
  }

  console.log("Current user ID:", currentUser.id);

  // Obtenemos el perfil del usuario actual para verificar si es admin
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role, operator_id")
    .eq("id", currentUser.id)
    .single();

  if (profileError) {
    console.error("Error fetching current user profile:", profileError);
    return [];
  }

  // Depuración adicional
  console.log("Current user profile:", currentProfile);
  console.log("Is admin?", currentProfile.role === 'admin');
  console.log("Operator ID:", currentProfile.operator_id);

  let query = supabase.from("profiles").select("*");
  
  // Si el usuario es admin, obtener todos los usuarios de su mismo operator_id
  // Si no es admin, solo obtener su propio perfil
  if (currentProfile.role === 'admin') {
    if (!currentProfile.operator_id) {
      console.error("Admin user has no operator_id");
      return [];
    }
    
    // Aquí está el cambio: explicitar que queremos todos los users del operator,
    // no solo los admins
    query = query.eq("operator_id", currentProfile.operator_id);
    console.log("Admin query: Fetching all users with operator_id =", currentProfile.operator_id);
  } else {
    query = query.eq("id", currentUser.id);
    console.log("Non-admin query: Only fetching current user profile");
  }
  
  const { data: profiles, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  console.log(`Found ${profiles?.length || 0} profiles:`, profiles);
  
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
  // Obtener el usuario actual
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) {
    throw new Error("Usuario no autenticado");
  }
  
  console.log("Calling create-user edge function with selected properties:", propertyIds);
  
  // Call the Edge Function to create the user
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
    console.error("Error from create-user function:", error);
    throw new Error(`Error al crear usuario: ${error.message}`);
  }
  
  if (!data.success) {
    console.error("Error creating user:", data.error);
    throw new Error(`Error al crear usuario: ${data.error}`);
  }
  
  console.log("User created successfully:", data.user);
  
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
