
import { PropertyType } from "@/types";

export interface PropertyRaw {
  id: string;
  operator_id: string;
  name: string;
  address: string;
  internal_code: string;
  notes?: string;
  image_url?: string;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  type?: string; // Changed from PropertyType to string to match the database structure
  parent_id?: string;
  description?: string;
  ical_token?: string;
  ical_url?: string;
  created_at: string;
}

export interface PropertyRelationship {
  parentId: string | null;
  childIds: string[];
}
