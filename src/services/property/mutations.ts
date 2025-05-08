
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyType } from "@/types";
import { mapPropertyFromDatabase } from "./mapper";
import { PropertyRaw } from "./types";

/**
 * Create a new property
 */
export const createProperty = async (propertyData: any): Promise<{success: boolean; data?: any; message?: string}> => {
  try {
    // Transform the data to match the database schema
    const propertyToInsert = {
      operator_id: propertyData.operatorId,
      name: propertyData.name,
      address: propertyData.address,
      internal_code: propertyData.internalCode,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      capacity: propertyData.capacity,
      type: propertyData.type,
      description: propertyData.description,
      notes: propertyData.notes,
      parent_id: propertyData.parentId || null,
    };
    
    const { data, error } = await supabase
      .from("properties")
      .insert(propertyToInsert)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating property:", error);
      return { success: false, message: error.message };
    }
    
    return {
      success: true,
      data: mapPropertyFromDatabase(data as PropertyRaw)
    };
  } catch (error: any) {
    console.error("Unexpected error creating property:", error);
    return { success: false, message: error.message || "Error inesperado al crear la propiedad" };
  }
};

/**
 * Set property relationship
 */
export const setPropertyRelationship = async (
  propertyId: string, 
  parentId?: string, 
  type?: PropertyType
): Promise<Property> => {
  const updates: any = {};
  if (parentId !== undefined) updates.parent_id = parentId;
  if (type !== undefined) updates.type = type;
  
  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", propertyId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating property ${propertyId} relationships:`, error);
    throw error;
  }
  
  return mapPropertyFromDatabase(data as PropertyRaw);
};

/**
 * Generate an iCal token for a property
 */
export const generateICalToken = async (propertyId: string): Promise<Property> => {
  // Generate a random token
  const token = Array(32)
    .fill(0)
    .map(() => Math.random().toString(36).charAt(2))
    .join('');
  
  const { data, error } = await supabase
    .from("properties")
    .update({ ical_token: token })
    .eq("id", propertyId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error generating iCal token for property ${propertyId}:`, error);
    throw error;
  }
  
  return mapPropertyFromDatabase(data as PropertyRaw);
};
