// This file is protected and cannot be modified.
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_DATABASE_URL || "https://mxcnywdsuqwsftmybphx.supabase.co",
  process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Y255d2RzdXF3c2Z0bXlicGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjQzODMsImV4cCI6MjA5MjgwMDM4M30.vRTrCngP-0zGhu2dJXRb_3vi54Ax8_dwPt6zDHkSoZY",
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
