import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL; 
const supabaseKey = process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});