import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
          // middleware refresh handles
        },
      },
    }
  );

  const { data: auth } = await supabase.auth.getUser();
if (!auth?.user) redirect("/login?redirect=/members/admin");

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

  const name =
    (me as any)?.display_name || (me as any)?.full_name || (me as any)?.email || "Admin";

  const styles = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #07070b; color: white; }

    .wrap {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 280px 1fr;
    }

    /* LEFT SIDEBAR = black */
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

    .brandLeft {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .brandTitle {
      font-weight: 900;
      letter-spacing: -0.02em;
      font-size: 16px;
      color: rgba(255,255,255,0.95);
    }

    .brandSub {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.10em;
      text-transform: uppercase;
    }

    .pill {
      font-size: 11px;
      font-weight: 800;
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.85);
      white-space: nowrap;
      text-transform: lowercase;
    }

    .nav {
      margin-top: 8px;
      display: grid;
      gap: 6px;
      padding: 0 6px;
    }

    .nav a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.86);
      text-decoration: none;
      font-size: 13px;
      font-weight: 800;
      transition: transform .12s ease, background .12s ease, border-color .12s ease;
    }

    .nav a:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.12);
    }

    .navSmall {
      font-size: 11px;
      font-weight: 900;
      color: rgba(255,255,255,0.45);
      margin: 14px 12px 6px;
      letter-spacing: 0.10em;
      text-transform: uppercase;
    }

    .meBox {
      margin-top: 16px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.04);
    }

    .meName {
      font-weight: 900;
      font-size: 13px;
      color: rgba(255,255,255,0.92);
    }

    .meRole {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
    }

    .meActions {
      margin-top: 10px;
      display: grid;
      gap: 8px;
    }

    .btnGhost {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 34px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.88);
      text-decoration: none;
      font-size: 12px;
      font-weight: 900;
    }

    .btnGhost:hover { background: rgba(255,255,255,0.10); }

    /* RIGHT SIDE = jake/royal blue tinted panel */
    .main {
      background:
        radial-gradient(900px 600px at 20% 20%, rgba(31,78,216,0.20), transparent 60%),
        radial-gradient(900px 650px at 80% 60%, rgba(7,14,168,0.18), transparent 60%),
        linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));
      padding: 22px 22px 40px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(8px);
    }

    .search {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .search input {
      width: min(640px, 100%);
      height: 38px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.18);
      color: rgba(255,255,255,0.92);
      padding: 0 14px;
      outline: none;
      font-size: 13px;
      font-weight: 700;
    }

    .search input::placeholder { color: rgba(255,255,255,0.45); }

    .topRight {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .broAdminTag {
      font-weight: 1000;
      letter-spacing: -0.03em;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.92);
      white-space: nowrap;
    }

    .content {
      margin-top: 18px;
    }

    @media (max-width: 980px) {
      .wrap { grid-template-columns: 1fr; }
      .side { position: relative; height: auto; }
    }
  `;

  return (
    <html lang="en">
      <body>
        <style>{styles}</style>

        <div className="wrap">
          {/* LEFT */}
          <aside className="side">
            <div className="brand">
              <div className="brandLeft">
                <div className="brandTitle">broTHER collecTive</div>
                <div className="brandSub">admin console</div>
              </div>
              <div className="pill">{role}</div>
            </div>

            <div className="nav">
              <Link href="/members/admin">Dashboard</Link>
              <Link href="/members/admin/inbox">Admin Inbox</Link>
              <Link href="/members/admin/events">Events</Link>
            </div>

            <div className="navSmall">Intake</div>
            <div className="nav">
              <Link href="/members/admin/access-requests">Access Requests</Link>
            </div>

            <div className="navSmall">Shortcuts</div>
            <div className="nav">
              <Link href="/members">Member Portal</Link>
              <Link href="/login">Login</Link>
            </div>

            <div className="meBox">
              <div className="meName">{name}</div>
              <div className="meRole">Role: {role}</div>

              <div className="meActions">
                <Link className="btnGhost" href="/members">
                  Go to Members →
                </Link>
              </div>
            </div>
          </aside>

          {/* RIGHT */}
          <main className="main">
            <div className="topbar">
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.85)" }}>Admin</div>

              <div className="search">
                <input placeholder="Search admin tools (coming soon)..." />
              </div>

              <div className="topRight">
                <div className="broAdminTag">broADMIN</div>
              </div>
            </div>

            <div className="content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
