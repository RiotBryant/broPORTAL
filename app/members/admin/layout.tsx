import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // 🔐 Require login
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?redirect=/members/admin");

  // 🔐 Pull role from user_roles (NOT profiles)
  const { data: roleRes, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .single();

  if (roleErr || !roleRes?.role) redirect("/members");

  const role = String(roleRes.role).toLowerCase().trim();

  const canEnterAdmin =
    role === "admin" ||
    role === "superadmin" ||
    role === "god";

  if (!canEnterAdmin) redirect("/members");

  // 👤 Pull display name (optional)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name, email")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const name =
    profile?.display_name ||
    profile?.full_name ||
    profile?.email ||
    auth.user.email ||
    "Admin";

  const styles = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #07070b; color: white; }

    .wrap {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 280px 1fr;
    }

    .side {
      background: #050508;
      border-right: 1px solid rgba(255,255,255,0.08);
      padding: 18px 14px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 10px 16px;
    }

    .brandTitle {
      font-weight: 900;
      font-size: 16px;
      color: white;
    }

    .pill {
      font-size: 11px;
      font-weight: 800;
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      text-transform: lowercase;
    }

    .nav {
      margin-top: 12px;
      display: grid;
      gap: 6px;
    }

    .nav a {
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: white;
      text-decoration: none;
      font-size: 13px;
      font-weight: 800;
    }

    .nav a:hover {
      background: rgba(255,255,255,0.08);
    }

    .main {
      background:
        radial-gradient(900px 600px at 20% 20%, rgba(31,78,216,0.20), transparent 60%),
        radial-gradient(900px 650px at 80% 60%, rgba(7,14,168,0.18), transparent 60%);
      padding: 24px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.05);
      margin-bottom: 20px;
    }

    .broAdminTag {
      font-weight: 900;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
    }
  `;

  return (
    <html lang="en">
      <body>
        <style>{styles}</style>

        <div className="wrap">
          <aside className="side">
            <div className="brand">
              <div className="brandTitle">broTHER collecTive</div>
              <div className="pill">{role}</div>
            </div>

            <div className="nav">
              <Link href="/members/admin">Dashboard</Link>
              <Link href="/members/admin/access-requests">Access Requests</Link>
              <Link href="/members/admin/inbox">Admin Inbox</Link>
              <Link href="/members/admin/events">Events</Link>
              <Link href="/members">Member Portal</Link>
            </div>
          </aside>

          <main className="main">
            <div className="topbar">
              <div>Admin Dashboard</div>
              <div className="broAdminTag">broADMIN</div>
            </div>

            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
