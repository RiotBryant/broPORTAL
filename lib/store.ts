import { supabase } from "@/lib/supabase/client";
import { getMyRole } from "@/lib/store";

export type Role = "member" | "admin" | "superadmin";

export async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) throw new Error("NOT_AUTHENTICATED");
  return user;
}

export async function getMyRole(): Promise<Role> {
  const user = await requireUser();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return (data?.role as Role) ?? "member";
}

export function isAdminRole(role: Role) {
  return role === "admin" || role === "superadmin";
}
