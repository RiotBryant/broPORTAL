import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGpoa3Vta2dlbGd2bGl1ZnVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxNjE1MCwiZXhwIjoyMDg1OTkyMTUwfQ.TCsCVaoas25QYYLt5mwZZwhkXbmfwemaU9i1cxp8PqE!
  );
}
