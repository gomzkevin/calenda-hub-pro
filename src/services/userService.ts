
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

/**
 * Get the currently authenticated user profile
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionData.session.user.id)
    .single();
  
  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    operatorId: data.operator_id || '',
    name: data.name,
    email: data.email,
    role: data.role as 'admin' | 'user',
    active: data.active,
    createdAt: new Date(data.created_at)
  };
};
