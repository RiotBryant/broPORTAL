import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

type ReqRow = {
  id: string;
  created_at: string;
  full_name: string | null;
  preferred_name: string | null;
  email: string | null;
  birthday: string | null;
  phone: string | null;
  location: string | null;
  referred_by: string | null;
  looking_for: string | null;
  why_brother_collective: string | null;
};

function pick(v: string | null | undefined) {
  return (v || "").trim() || "—";
}

export default async function AccessRequestsAdminPage() {
  // normal auth client (anon) just to identify the user + role
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
  if (!auth?.user) redirect("/login?redirect=/members/admin/access-requests");

  // check role from profiles
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  const role = (me as any)?.role || "member";
  if (role !== "admin" && role !== "superadmin") redirect("/members");

  // service role read (RLS-proof)
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("access_requests")
    .select(
      "id, created_at, full_name, preferred_name, email, birthday, phone, location, referred_by, looking_for, why_brother_collective"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data || []) as ReqRow[];

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs tracking-widest text-white/50">broTHER collecTive</div>
            <div className="text-2xl font-semibold">Access Requests</div>
            <div className="mt-1 text-sm text-white/60">Admin / Superadmin only</div>
          </div>

          <Link
            href="/members"
            className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            ← Back
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
            {error.message}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-medium text-white/85">Requests</div>
            <div className="text-xs text-white/50">{rows.length} shown</div>
          </div>

          {rows.length === 0 ? (
            <div className="p-4 text-sm text-white/70">No access requests yet.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {rows.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">
                        {pick(r.preferred_name) !== "—" ? pick(r.preferred_name) : pick(r.full_name)}
                        <span className="text-white/50 font-normal"> • {pick(r.email)}</span>
                      </div>

                      <div className="mt-1 text-xs text-white/55">
                        Birthday: {pick(r.birthday)} • Phone: {pick(r.phone)} • Location: {pick(r.location)} • Referred by:{" "}
                        {pick(r.referred_by)}
                      </div>

                      <div className="mt-3 text-xs text-white/60">Looking for</div>
                      <div className="text-sm text-white/80 whitespace-pre-wrap">{pick(r.looking_for)}</div>

                      <div className="mt-3 text-xs text-white/60">Why this space</div>
                      <div className="text-sm text-white/80 whitespace-pre-wrap">{pick(r.why_brother_collective)}</div>
                    </div>

                    <div className="text-xs text-white/50 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-white/40">
          Tip: Bookmark this page. You can also link it from your admin dashboard button.
        </div>
      </div>
    </div>
  );
}
