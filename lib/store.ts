import { supabase } from "@/lib/supabase/client";

export type Role = "member" | "admin" | "superadmin";

export function isAdminRole(role: Role) {
  return role === "admin" || role === "superadmin";
}

export async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) throw new Error("NOT_AUTHENTICATED");
  return user;
}

export async function getMyRole(): Promise<Role> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return "member";
  }

  const r = (data?.role ?? "member") as Role;
  return r;
}
export type NextEvent = {
  title: string;
  starts_at: string; // ISO string
};
