
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

export const supabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://akqzaaniiflyxfrzipqq.supabase.co";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  return createClient(supabaseUrl, supabaseKey);
};
