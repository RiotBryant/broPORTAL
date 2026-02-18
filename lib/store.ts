import { createClient } from "@/lib/supabase/client";

export type Role = "new" | "member" | "admin" | "superadmin" | "god";

export function isAdminRole(role: Role) {
  return role === "admin" || role === "superadmin" || role === "god";
}

export async function getMyRole(): Promise<Role> {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return "new";

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle();

  return (roleRow?.role ?? "member") as Role;
}
