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
    // 1. Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError) {
      console.error("Error detallado al crear usuario:", authError);
      throw new Error(authError.message || "Error al crear el usuario");
    }

    if (!authData.user) {
      throw new Error("No user returned from sign up");
    }

    // 2. Get the user profile that was automatically created by the trigger
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching created profile:", profileError);
      throw new Error(profileError.message || "Error al obtener el perfil");
    }

    // 3. If property IDs were provided and current user is admin, create access records
    if (propertyIds.length > 0) {
      // Get the current user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;
      
      const { error: accessError } = await supabase
        .from("user_property_access")
        .insert(
          propertyIds.map(propertyId => ({
            user_id: authData.user.id,
            property_id: propertyId,
            created_by: currentUserId
          }))
        );

      if (accessError) {
        console.error("Error creating property access:", accessError);
        throw new Error(accessError.message || "Error al crear accesos a propiedades");
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
    // Map known Supabase errors to friendly messages
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        throw new Error('El email ya está registrado');
      }
    }
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
