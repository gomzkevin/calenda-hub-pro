
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/types";

/**
 * Fetch all properties from the database
 */
export const getProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from("properties")
    .select("*");
  
  if (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
  
  return data ? data.map((prop) => ({
    id: prop.id,
    operatorId: prop.operator_id,
    name: prop.name,
    address: prop.address,
    internalCode: prop.internal_code,
    notes: prop.notes || undefined,
    imageUrl: prop.image_url || undefined,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    capacity: prop.capacity,
    type: prop.type || undefined,
    description: prop.description || undefined,
    createdAt: new Date(prop.created_at)
  })) : [];
};

/**
 * Fetch a property by ID
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error(`Error fetching property with id ${id}:`, error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    operatorId: data.operator_id,
    name: data.name,
    address: data.address,
    internalCode: data.internal_code,
    notes: data.notes || undefined,
    imageUrl: data.image_url || undefined,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    capacity: data.capacity,
    type: data.type || undefined,
    description: data.description || undefined,
    createdAt: new Date(data.created_at)
  };
};
