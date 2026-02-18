import { createClient } from "@/lib/supabase/client";

export type Role = "new" | "member" | "admin" | "superadmin" | "god";

export type AuthedUser = {
  id: string;
  email?: string | null;
};

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
 * Client-side auth helper expected by UI components.
 * Returns { id, email } so callers can do user.id.
 * Throws if not signed in.
 */
export async function requireUser(): Promise<AuthedUser> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);

  const u = data.user;
  if (!u?.id) throw new Error("Not signed in.");

  return { id: u.id, email: u.email };
}

/**
 * Returns my role from public.user_roles.
 * Falls back to "member" if row is missing.
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
