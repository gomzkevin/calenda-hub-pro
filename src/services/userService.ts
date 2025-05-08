
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  operator_id: string;
  createdAt?: Date;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

export const getUserProfile = async (): Promise<Profile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return profile as Profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<Profile | null> => {
  return getUserProfile();
};

export const getUsers = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    
    // Transform dates and map operator_id to operatorId for frontend consistency
    return data.map(profile => ({
      ...profile,
      createdAt: profile.created_at ? new Date(profile.created_at) : undefined
    })) as Profile[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getUserPropertyAccess = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_property_access')
      .select('property_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => item.property_id);
  } catch (error) {
    console.error('Error fetching user property access:', error);
    return [];
  }
};

export const updateUserPropertyAccess = async (userId: string, propertyIds: string[]): Promise<GenericResponse> => {
  try {
    // First delete all existing access
    const { error: deleteError } = await supabase
      .from('user_property_access')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;
    
    // If there are no properties to add, we're done
    if (propertyIds.length === 0) {
      return { success: true, message: 'Property access updated successfully' };
    }

    // Then add the new access
    const accessRecords = propertyIds.map(propertyId => ({
      user_id: userId,
      property_id: propertyId
    }));

    const { error: insertError } = await supabase
      .from('user_property_access')
      .insert(accessRecords);

    if (insertError) throw insertError;
    return { success: true, message: 'Property access updated successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update property access' };
  }
};

export const updateUserStatus = async (userId: string, active: boolean): Promise<GenericResponse> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ active })
      .eq('id', userId);

    if (error) throw error;
    return { success: true, message: 'User status updated successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update user status' };
  }
};

export const createUser = async (
  email: string, 
  password: string, 
  name: string, 
  propertyIds: string[] = []
): Promise<GenericResponse> => {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) throw authError;

    // If user creation was successful, assign properties if any
    if (authData.user && propertyIds.length > 0) {
      const accessRecords = propertyIds.map(propertyId => ({
        user_id: authData.user.id,
        property_id: propertyId
      }));

      const { error: accessError } = await supabase
        .from('user_property_access')
        .insert(accessRecords);

      if (accessError) {
        console.error('Error assigning properties to user:', accessError);
        // We don't throw here, as the user was still created successfully
      }
    }

    return { 
      success: true, 
      message: 'User created successfully'
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to create user'
    };
  }
};

export const getUserPropertyIds = async (userId: string): Promise<string[]> => {
  try {
    // This is the correct version that should pass TypeScript validation
    const { data, error } = await supabase
      .from('user_property_access')
      .select('property_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => item.property_id);
  } catch (error) {
    console.error('Error fetching user properties:', error);
    return [];
  }
};

export const addUserPropertyAccess = async (userId: string, propertyId: string): Promise<GenericResponse> => {
  try {
    // This is the correct version that should pass TypeScript validation
    const { error } = await supabase
      .from('user_property_access')
      .insert({ user_id: userId, property_id: propertyId });

    if (error) throw error;
    return { success: true, message: 'Property access added successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to add property access' };
  }
};

export const removeUserPropertyAccess = async (userId: string, propertyId: string): Promise<GenericResponse> => {
  try {
    // This is the correct version that should pass TypeScript validation
    const { error } = await supabase
      .from('user_property_access')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);

    if (error) throw error;
    return { success: true, message: 'Property access removed successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to remove property access' };
  }
};
