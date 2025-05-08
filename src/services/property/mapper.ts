
import { Property } from "@/types";
import { PropertyRaw } from "./types";

/**
 * Maps a property from the database format to the application format
 */
export const mapPropertyFromDatabase = (prop: PropertyRaw): Property => ({
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
  type: prop.type as any || 'standalone',
  parentId: prop.parent_id || undefined,
  description: prop.description || undefined,
  ical_token: prop.ical_token || undefined,
  ical_url: prop.ical_url || undefined,
  createdAt: new Date(prop.created_at)
});
