
import { supabase } from "@/integrations/supabase/client";
import { Operator } from "@/types";

/**
 * Fetch all operators from the database
 */
export const getOperators = async (): Promise<Operator[]> => {
  const { data, error } = await supabase
    .from("operators")
    .select("*");
  
  if (error) {
    console.error("Error fetching operators:", error);
    throw error;
  }
  
  return data ? data.map((op) => ({
    id: op.id,
    name: op.name,
    slug: op.slug,
    logoUrl: op.logo_url,
    createdAt: new Date(op.created_at)
  })) : [];
};
