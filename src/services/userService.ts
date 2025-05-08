
import { supabase } from '@/integrations/supabase/client';
import { GenericResponse } from '@/types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  operator_id: string;
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

export const getUsers = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data as Profile[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
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
