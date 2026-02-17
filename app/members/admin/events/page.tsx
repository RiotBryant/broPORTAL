import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Role = "new" | "member" | "admin" | "superadmin" | "god";
const rank = (r: Role) =>
  r === "new" ? 0 : r === "member" ? 1 : r === "admin" ? 2 : r === "superadmin" ? 3 : 4;

export default async function AdminEventsPage() {
  const supabase = createClient();

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) redirect("/login");

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle();

  const role = (roleRow?.role ?? "member") as Role;
  if (rank(role) < rank("admin")) redirect("/members");

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin • Events</h1>
            <p className="mt-2 text-sm text-white/70">
              This page is now real-auth gated. We’ll wire calendar + countdown next.
            </p>
          </div>
          <Link href="/members" className="text-sm text-white/70 hover:text-white">
            ← Back to Portal
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-white/70">
            No mock store. This is ready for:
            <ul className="list-disc pl-5 mt-2">
              <li>Events table</li>
              <li>Countdown widget</li>
              <li>Admin create/edit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
