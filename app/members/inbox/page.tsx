
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function AdminInboxPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components can't set cookies here; middleware handles refresh.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → go login and come back here
  if (!user) redirect("/login?redirect=/members/admin/inbox");

  // ✅ Admin-only gate using your user_roles table
  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // If role lookup fails or user isn't admin/superadmin → kick to main portal
  const role = roleRow?.role ?? "";
  const isAdmin = role === "admin" || role === "superadmin";

  if (roleErr || !isAdmin) redirect("/members");

  // ✅ If you want to show actual inbox items later, we'll wire it.
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Admin Inbox</h1>
      <p className="mt-2 text-sm opacity-80">
        You are authenticated and authorized. (Next: show requests/messages here.)
      </p>
    </div>
  );
}
