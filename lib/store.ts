import { supabase } from "@/lib/supabase/client";

export type Role = "member" | "admin" | "superadmin";

export async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("NOT_AUTHENTICATED");
  return data.user;
}

export async function getMyRole(): Promise<Role> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error || !data?.role) return "member";
  return data.role as Role;
}
