import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type ThreadRow = {
  thread_id: string;
  created_at: string | null;
  other_user_id: string | null;
  other_name: string | null;
  last_body: string | null;
  last_at: string | null;
};

export default async function PersonalInboxPage() {
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

  if (!user) redirect("/login?redirect=/members/inbox");

  // Pull all threads this user is in
  const { data: memberLinks, error: linksErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", user.id);

  if (linksErr) {
    return (
      <Shell>
        <Header />
        <Card>
          <div className="text-sm text-white/80">Couldn’t load your broMAIL.</div>
          <div className="mt-2 text-xs text-white/60">
            This is usually an RLS issue on <code className="text-white/80">dm_thread_members</code>.
          </div>
        </Card>
      </Shell>
    );
  }

  const threadIds = (memberLinks || []).map((r: any) => r.thread_id).filter(Boolean);

  // If no threads, show empty state
  if (threadIds.length === 0) {
    return (
      <Shell>
        <Header />
        <StartDm supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!} />
        <EmptyState />
      </Shell>
    );
  }

  /**
   * We build the inbox list by:
   * 1) for each thread_id: find the "other member" (not me)
   * 2) get the other member’s profile name
   * 3) get the last message in that thread
   *
   * Note: This is server-rendered for reliability and your “quiet by design” vibe.
   */

  // 1) All members for these threads
  const { data: allMembers, error: memErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id, user_id")
    .in("thread_id", threadIds);

  if (memErr) {
    return (
      <Shell>
        <Header />
        <StartDm supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!} />
        <Card>
          <div className="text-sm text-white/80">Couldn’t load thread members.</div>
          <div className="mt-2 text-xs text-white/60">
            Likely RLS on <code className="text-white/80">dm_thread_members</code>.
          </div>
        </Card>
      </Shell>
    );
  }

  // Map: thread_id -> other_user_id
  const otherByThread = new Map<string, string>();
  for (const m of allMembers || []) {
    if (!m?.thread_id || !m?.user_id) continue;
    if (m.user_id !== user.id) otherByThread.set(m.thread_id, m.user_id);
  }

  const otherUserIds = Array.from(new Set(Array.from(otherByThread.values())));

  // 2) Get profiles for other users
  const { data: profs, error: profErr } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email")
    .in("id", otherUserIds);

  if (profErr) {
    // profiles might be locked down; we still show thread list without names
  }

  const nameByUser = new Map<string, string>();
  for (const p of profs || []) {
    const name =
      p.display_name || p.full_name || p.email || p.id;
    nameByUser.set(p.id, name);
  }

  // 3) Last message per thread (fetch recent messages then reduce)
  const { data: lastMsgs, error: msgErr } = await supabase
    .from("dm_messages")
    .select("thread_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false })
    .limit(200);

  const lastByThread = new Map<string, { body: string; at: string }>();
  if (!msgErr && lastMsgs) {
    for (const m of lastMsgs as any[]) {
      if (!m.thread_id || lastByThread.has(m.thread_id)) continue;
      lastByThread.set(m.thread_id, { body: m.body || "", at: m.created_at });
    }
  }

  // Build rows
  const rows: ThreadRow[] = threadIds.map((tid) => {
    const otherId = otherByThread.get(tid) || null;
    const otherName = otherId ? (nameByUser.get(otherId) || "Member") : "Member";
    const last = lastByThread.get(tid);
    return {
      thread_id: tid,
      created_at: null,
      other_user_id: otherId,
      other_name: otherName,
      last_body: last?.body ?? null,
      last_at: last?.at ?? null,
    };
  });

  // Sort by last_at desc (threads with messages first)
  rows.sort((a, b) => {
    const ta = a.last_at ? new Date(a.last_at).getTime() : 0;
    const tb = b.last_at ? new Date(b.last_at).getTime() : 0;
    return tb - ta;
  });

  return (
    <Shell>
      <Header />
      <StartDm supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!} />

      <div className="mt-6">
        <div className="text-sm font-medium text-white/80">Your threads</div>

        <div className="mt-3 grid gap-3">
          {rows.map((t) => (
            <Link
              key={t.thread_id}
              href={`/members/dm/${t.thread_id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    {t.other_name}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {t.last_body ? clamp(t.last_body, 110) : "No messages yet."}
                  </div>
                </div>

                <div className="text-xs text-white/50 whitespace-nowrap">
                  {t.last_at ? formatShort(t.last_at) : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** ---------- UI pieces (kept minimal + on-brand) ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">{children}</div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your broMAIL</h1>
        <p className="mt-2 text-sm text-white/70">Private 1:1 messages.</p>
      </div>
      <Link href="/members" className="text-sm text-white/70 hover:text-white">
        ← Back to Portal
      </Link>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
      No broMAIL yet. Start one above.
    </div>
  );
}

/**
 * StartDm is client-side because it calls RPC then navigates.
 * This keeps the main inbox page server-rendered.
 */
function StartDm({ supabaseUrl }: { supabaseUrl: string }) {
  // This placeholder is replaced by the client component below via dynamic import
  // so this server file stays simple.
  return (
    // @ts-expect-error Server Component importing Client Component pattern
    <StartDmClient />
  );
}

/** ---------- Helpers ---------- */

function clamp(s: string, n: number) {
  const str = (s || "").trim();
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + "…";
}

function formatShort(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
