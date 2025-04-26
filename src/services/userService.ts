
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
 * Create a new user with specified properties access
 */
export const createUser = async (
  email: string,
  password: string,
  name: string,
  propertyIds: string[] = []
): Promise<User> => {
  // 1. Create the user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (authError) {
    console.error("Error creating user:", authError);
    throw authError;
  }

  // 2. Get the user profile that was automatically created by the trigger
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching created profile:", profileError);
    throw profileError;
  }

  // 3. If property IDs were provided, create access records
  if (propertyIds.length > 0) {
    const { error: accessError } = await supabase
      .from("user_property_access")
      .insert(
        propertyIds.map(propertyId => ({
          user_id: authData.user.id,
          property_id: propertyId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }))
      );

    if (accessError) {
      console.error("Error creating property access:", accessError);
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
    const { error: insertError } = await supabase
      .from("user_property_access")
      .insert(
        propertyIds.map(propertyId => ({
          user_id: userId,
          property_id: propertyId,
          created_by: (await supabase.auth.getUser()).data.user?.id
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
