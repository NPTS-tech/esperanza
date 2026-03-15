import { createClient } from "@supabase/supabase-js";

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_service_role_key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function get_supabase_admin() {
  if (!supabase_url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!supabase_service_role_key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return createClient(
    supabase_url,
    supabase_service_role_key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export const supabase_storage_bucket =
  process.env.SUPABASE_STORAGE_BUCKET || "event-images";
