
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyType } from "@/types";

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
    type: prop.type as PropertyType || undefined,
    parentId: prop.parent_id || undefined,
    description: prop.description || undefined,
    createdAt: new Date(prop.created_at)
  })) : [];
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
    type: data.type as PropertyType || undefined,
    parentId: data.parent_id || undefined,
    description: data.description || undefined,
    createdAt: new Date(data.created_at)
  };
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
  
  return data ? data.map(mapPropertyFromDatabase) : [];
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
  
  return data ? data.map(mapPropertyFromDatabase) : [];
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
  
  return mapPropertyFromDatabase(data);
};

const mapPropertyFromDatabase = (prop: any): Property => ({
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
  type: prop.type as PropertyType || 'standalone',
  parentId: prop.parent_id || undefined,
  description: prop.description || undefined,
  createdAt: new Date(prop.created_at)
});
