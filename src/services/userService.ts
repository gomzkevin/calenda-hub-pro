
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

/**
 * Get all users with their profiles
 */
export const getUsers = async (): Promise<User[]> => {
  // Get the current user's operator_id first
  const { data: currentUserData } = await supabase.auth.getUser();
  if (!currentUserData.user) {
    throw new Error("No authenticated user found");
  }

  // Get the current user's profile to find their operator_id
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("operator_id")
    .eq("id", currentUserData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching current user profile:", profileError);
    throw profileError;
  }

  const operatorId = currentProfile.operator_id;

  // Now get all profiles that belong to the same operator
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("operator_id", operatorId)
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
    // Get the current user to determine operator_id
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }
    
    // Get current user's operator_id
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("operator_id")
      .eq("id", currentUser.id)
      .single();
      
    if (profileError) {
      console.error("Error fetching current user profile:", profileError);
      throw profileError;
    }
    
    const operatorId = currentProfile.operator_id;

    // 1. Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          name,
          operator_id: operatorId // Pass operator_id to trigger
        }
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
    const { data: profile, error: newProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (newProfileError) {
      console.error("Error fetching created profile:", newProfileError);
      throw new Error(newProfileError.message || "Error al obtener el perfil");
    }
    
    // Ensure the profile has the correct operator_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ operator_id: operatorId })
      .eq("id", authData.user.id);
      
    if (updateError) {
      console.error("Error updating profile operator_id:", updateError);
    }

    // 3. If property IDs were provided, create access records
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
        console.error("Error creating property access:", accessError);
        throw new Error(accessError.message || "Error al crear accesos a propiedades");
      }
    }

    return {
      id: profile.id,
      operatorId: profile.operator_id || operatorId,
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
 * Update user profile information
 */
export const updateUserProfile = async (
  userId: string,
  data: { name: string; email: string }
): Promise<User> => {
  // Update auth email if changed
  if (data.email) {
    const { error: authError } = await supabase.auth.updateUser({
      email: data.email,
    });

    if (authError) {
      console.error("Error updating auth email:", authError);
      throw new Error(authError.message);
    }
  }

  // Update profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ name: data.name, email: data.email })
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    console.error("Error updating profile:", profileError);
    throw new Error(profileError.message);
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
 * Update user password
 */
export const updateUserPassword = async (password: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Error updating password:", error);
    throw new Error(error.message);
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
    // Get the current user
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
