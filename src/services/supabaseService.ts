
import { supabase } from "@/integrations/supabase/client";
import { ICalLink, Operator, Property, Reservation, User } from "@/types";

// Operadores
export const getOperators = async (): Promise<Operator[]> => {
  const { data, error } = await supabase.from("operators").select("*");
  
  if (error) {
    console.error("Error fetching operators:", error);
    throw error;
  }
  
  return data.map((op) => ({
    id: op.id,
    name: op.name,
    slug: op.slug,
    logoUrl: op.logo_url,
    createdAt: new Date(op.created_at)
  }));
};

// Perfiles/Usuarios
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
  
  return {
    id: data.id,
    operatorId: data.operator_id,
    name: data.name,
    email: data.email,
    role: data.role,
    active: data.active,
    createdAt: new Date(data.created_at)
  };
};

// Propiedades
export const getProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase.from("properties").select("*");
  
  if (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
  
  return data.map((prop) => ({
    id: prop.id,
    operatorId: prop.operator_id,
    name: prop.name,
    address: prop.address,
    internalCode: prop.internal_code,
    notes: prop.notes,
    imageUrl: prop.image_url,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    capacity: prop.capacity,
    type: prop.type,
    description: prop.description,
    createdAt: new Date(prop.created_at)
  }));
};

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
  
  return {
    id: data.id,
    operatorId: data.operator_id,
    name: data.name,
    address: data.address,
    internalCode: data.internal_code,
    notes: data.notes,
    imageUrl: data.image_url,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    capacity: data.capacity,
    type: data.type,
    description: data.description,
    createdAt: new Date(data.created_at)
  };
};

// Enlaces iCal
export const getICalLinks = async (): Promise<ICalLink[]> => {
  const { data, error } = await supabase.from("ical_links").select("*");
  
  if (error) {
    console.error("Error fetching iCal links:", error);
    throw error;
  }
  
  return data.map((link) => ({
    id: link.id,
    propertyId: link.property_id,
    platform: link.platform as any,
    url: link.url,
    createdAt: new Date(link.created_at)
  }));
};

export const getICalLinksForProperty = async (propertyId: string): Promise<ICalLink[]> => {
  const { data, error } = await supabase
    .from("ical_links")
    .select("*")
    .eq("property_id", propertyId);
  
  if (error) {
    console.error(`Error fetching iCal links for property ${propertyId}:`, error);
    throw error;
  }
  
  return data.map((link) => ({
    id: link.id,
    propertyId: link.property_id,
    platform: link.platform as any,
    url: link.url,
    createdAt: new Date(link.created_at)
  }));
};

// Reservaciones
export const getReservations = async (): Promise<Reservation[]> => {
  const { data, error } = await supabase.from("reservations").select("*");
  
  if (error) {
    console.error("Error fetching reservations:", error);
    throw error;
  }
  
  return data.map((res) => ({
    id: res.id,
    propertyId: res.property_id,
    userId: res.user_id || undefined,
    startDate: new Date(res.start_date),
    endDate: new Date(res.end_date),
    platform: res.platform as any,
    source: res.source as any,
    icalUrl: res.ical_url,
    notes: res.notes,
    createdAt: new Date(res.created_at)
  }));
};

export const getReservationsForProperty = async (propertyId: string): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("property_id", propertyId);
  
  if (error) {
    console.error(`Error fetching reservations for property ${propertyId}:`, error);
    throw error;
  }
  
  return data.map((res) => ({
    id: res.id,
    propertyId: res.property_id,
    userId: res.user_id || undefined,
    startDate: new Date(res.start_date),
    endDate: new Date(res.end_date),
    platform: res.platform as any,
    source: res.source as any,
    icalUrl: res.ical_url,
    notes: res.notes,
    createdAt: new Date(res.created_at)
  }));
};

export const getReservationsForMonth = async (
  month: number,
  year: number
): Promise<Reservation[]> => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
  
  if (error) {
    console.error(`Error fetching reservations for ${month}/${year}:`, error);
    throw error;
  }
  
  return data.map((res) => ({
    id: res.id,
    propertyId: res.property_id,
    userId: res.user_id || undefined,
    startDate: new Date(res.start_date),
    endDate: new Date(res.end_date),
    platform: res.platform as any,
    source: res.source as any,
    icalUrl: res.ical_url,
    notes: res.notes,
    createdAt: new Date(res.created_at)
  }));
};
