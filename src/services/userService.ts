
import { supabase } from '@/integrations/supabase/client';
import { getOperators } from './operatorService';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  operator_id: string;
  operatorName?: string; // Añadido para almacenar el nombre del operador
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
    // This will now retrieve all users for admins based on the RLS policy
    // and only their own profile for regular users
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    console.log('Fetched users:', data); // Debug to see what's being returned
    
    // Get operators to map operator_id to operator names
    const operators = await getOperators();
    const operatorMap = new Map(operators.map(op => [op.id, op.name]));
    
    // Transform dates and map operator_id to operatorId for frontend consistency
    return data.map(profile => ({
      ...profile,
      operatorName: operatorMap.get(profile.operator_id) || 'Desconocido',
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
    // Get the current user's ID to identify the admin creating the user
    const currentUser = await getCurrentUser();

    if (!currentUser || !currentUser.id) {
      return {
        success: false,
        message: 'No authenticated user found. Please log in again.'
      };
    }

    console.log('Current admin user creating new user:', currentUser);
    
    // Call the edge function instead of using auth.admin directly
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email,
        password,
        name,
        propertyIds,
        requestingUserId: currentUser.id
      }
    });

    if (error) {
      console.error('Error from create-user function:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred while creating the user'
      };
    }

    if (!data.success) {
      console.error('Error response from create-user function:', data.error);
      return { 
        success: false, 
        message: data.error || 'Failed to create user'
      };
    }

    console.log('User created successfully:', data.user);
    return { 
      success: true, 
      message: 'User created successfully'
    };
  } catch (error: any) {
    console.error('Exception creating user:', error);
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
