import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/types";
import { mapPropertyFromDatabase } from "./mapper";
import { PropertyRaw } from "./types";

/**
 * Fetch all properties from the database
 * The RLS policies will automatically filter properties based on user access
 */
export const getProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from("properties")
    .select("*");
  
  if (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
  
  return data ? data.map((prop) => mapPropertyFromDatabase(prop as PropertyRaw)) : [];
};

/**
 * Fetch a single property by ID
 */
export const getPropertyById = async (propertyId: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") { // No rows returned
      return null;
    }
    console.error(`Error fetching property ${propertyId}:`, error);
    throw error;
  }
  
  if (!data) return null;
  
  return mapPropertyFromDatabase(data as PropertyRaw);
};

/**
 * Fetch all properties with their relationships
 */
export const getPropertiesWithRelationships = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from("properties")
    .select("*, parent:parent_id(id, name)");
  
  if (error) {
    console.error("Error fetching properties with relationships:", error);
    throw error;
  }
  
  return data ? data.map(prop => mapPropertyFromDatabase(prop as PropertyRaw)) : [];
};

/**
 * Get child properties for a parent property
 */
export const getChildProperties = async (parentId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("parent_id", parentId);
  
  if (error) {
    console.error(`Error fetching child properties for parent ${parentId}:`, error);
    throw error;
  }
  
  return data ? data.map(prop => mapPropertyFromDatabase(prop as PropertyRaw)) : [];
};

/**
 * Get available properties that can be used in relationships
 * (excludes the current property and its children)
 */
export const getPropertiesForRelation = async (currentPropertyId: string): Promise<Property[]> => {
  // First, get all properties
  const allProperties = await getProperties();
  
  // Filter out the current property and its children
  return allProperties.filter(property => 
    property.id !== currentPropertyId && 
    property.parentId !== currentPropertyId
  );
};

/**
 * Get properties accessible to the current user
 * This is useful for getting a list of properties a user can access
 */
export const getUserAccessibleProperties = async (): Promise<Property[]> => {
  try {
    // The RLS policies will automatically filter properties based on the user's access
    const { data, error } = await supabase
      .from("properties")
      .select("*");
    
    if (error) {
      console.error("Error fetching user accessible properties:", error);
      throw error;
    }
    
    return data ? data.map(prop => mapPropertyFromDatabase(prop as PropertyRaw)) : [];
  } catch (error) {
    console.error("Error fetching user accessible properties:", error);
    return [];
  }
};
