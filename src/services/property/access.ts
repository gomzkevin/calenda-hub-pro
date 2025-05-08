
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has access to a specific property
 */
export const hasPropertyAccess = async (propertyId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .maybeSingle();
    
    if (error) {
      console.error(`Error checking property access for ${propertyId}:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error checking property access for ${propertyId}:`, error);
    return false;
  }
};

/**
 * Check if the current access permissions are working properly
 * By testing access to a specific property
 */
export const testPropertyAccess = async (propertyId: string): Promise<{ 
  hasAccess: boolean, 
  error?: string 
}> => {
  try {
    // Specifically for debugging permission issues
    const { data, error } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", propertyId)
      .single();
    
    if (error) {
      return { 
        hasAccess: false, 
        error: `Error: ${error.message} (${error.code})`
      };
    }
    
    return { hasAccess: !!data };
  } catch (error: any) {
    return { 
      hasAccess: false, 
      error: error.message || "Unknown error"
    };
  }
};
