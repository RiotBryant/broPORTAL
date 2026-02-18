import { createClient } from "@/lib/supabase/client";

export type Role = "new" | "member" | "admin" | "superadmin" | "god";

export function rank(r: Role) {
  return r === "new"
    ? 0
    : r === "member"
    ? 1
    : r === "admin"
    ? 2
    : r === "superadmin"
    ? 3
    : 4; // god
}

export function isAdminRole(role: Role) {
  return rank(role) >= rank("admin");
}

/**
 * Returns the current authed user's id.
 * Throws if not signed in (client-side).
 */
export async function requireUser(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

/**
 * Returns my role from public.user_roles.
 * Falls back to "member" if the row is missing.
 * Returns "new" if not signed in.
 */
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
