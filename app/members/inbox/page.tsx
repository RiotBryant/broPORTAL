import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SearchBar from "./SearchBar";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

type ThreadItem = {
  threadId: string;
  otherUserId: string | null;
  otherName: string;
  lastBody: string;
  lastAt: string | null;
};

type MessagePreview = {
  thread_id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
};

function pickName(p: ProfileLite | null) {
  if (!p) return "broTHER";
  return p.display_name || p.full_name || p.email || "broTHER";
}

function clamp(s: string, n: number) {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

function formatShort(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default async function BroMailInboxPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams?.q || "").toLowerCase().trim();

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

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const myName = pickName((myProfile as any) || null);

  const { data: myThreads, error: threadsErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", user.id);

  if (threadsErr) {
    return (
      <Shell>
        <Header myName={myName} />
        <SearchBar />
        <GlassCard>
          <div className="text-sm text-white/80">broMAIL couldn’t load.</div>
          <div className="mt-2 text-xs text-white/60">
            This is usually RLS on <code className="text-white/80">dm_thread_members</code>.
          </div>
        </GlassCard>
      </Shell>
    );
  }

  const threadIds = (myThreads || []).map((r: any) => r.thread_id).filter(Boolean);

  // Read tracking (for unread badges)
  const { data: reads } = await supabase
    .from("dm_thread_reads")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id);

  const readByThread = new Map<string, string>();
  for (const r of reads || []) readByThread.set((r as any).thread_id, (r as any).last_read_at);

  if (threadIds.length === 0) {
    return (
      <Shell>
        <Header myName={myName} />
        <SearchBar />
        <ActionsRow />
        <EmptyState />
      </Shell>
    );
  }

  const { data: membersRows } = await supabase
    .from("dm_thread_members")
    .select("thread_id, user_id")
    .in("thread_id", threadIds);

  const otherByThread = new Map<string, string>();
  for (const m of membersRows || []) {
    if (!m?.thread_id || !m?.user_id) continue;
    if (m.user_id !== user.id) otherByThread.set(m.thread_id, m.user_id);
  }

  const otherUserIds = Array.from(new Set(Array.from(otherByThread.values())));

  const { data: others } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email")
    .in("id", otherUserIds);

  const nameByUser = new Map<string, string>();
  for (const p of (others || []) as ProfileLite[]) nameByUser.set(p.id, pickName(p));

  // Recent messages (includes sender_id for unread math)
  const { data: recentMsgs } = await supabase
    .from("dm_messages")
    .select("thread_id, sender_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false })
    .limit(400);

  // last message per thread
  const lastByThread = new Map<string, MessagePreview>();
  for (const m of (recentMsgs || []) as any[]) {
    if (!m.thread_id) continue;
    if (lastByThread.has(m.thread_id)) continue;
    lastByThread.set(m.thread_id, m as MessagePreview);
  }

  // unread counts per thread
  const unreadCountByThread = new Map<string, number>();
  for (const m of (recentMsgs || []) as any[]) {
    const tid = m.thread_id;
    if (!tid) continue;
    if (m.sender_id === user.id) continue;

    const lastRead = readByThread.get(tid);
    if (!lastRead) {
      unreadCountByThread.set(tid, (unreadCountByThread.get(tid) || 0) + 1);
      continue;
    }

    if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
      unreadCountByThread.set(tid, (unreadCountByThread.get(tid) || 0) + 1);
    }
  }

  const items: ThreadItem[] = threadIds.map((tid) => {
    const otherId = otherByThread.get(tid) || null;
    const otherName = otherId ? nameByUser.get(otherId) || "broTHER" : "broTHER";
    const last = lastByThread.get(tid);

    return {
      threadId: tid,
      otherUserId: otherId,
      otherName,
      lastBody: last?.body ? clamp(last.body, 120) : "No messages yet.",
      lastAt: last?.created_at || null,
    };
  });

  items.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });

  // Search filter (name or last message)
  const visibleItems = q
    ? items.filter((t) => {
        const a = (t.otherName || "").toLowerCase();
        const b = (t.lastBody || "").toLowerCase();
        return a.includes(q) || b.includes(q);
      })
    : items;

  const previewThreadId = visibleItems[0]?.threadId || null;

  const { data: previewMsgs } = previewThreadId
    ? await supabase
        .from("dm_messages")
        .select("id, thread_id, sender_id, body, created_at")
        .eq("thread_id", previewThreadId)
        .order("created_at", { ascending: false })
        .limit(15)
    : ({ data: [] } as any);

  const preview = ((previewMsgs || []) as any[]).reverse();

  return (
    <Shell>
      <Header myName={myName} />
      <SearchBar />
      <ActionsRow />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT: Inbox list */}
        <div className="lg:col-span-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-white/80">Inbox</div>
            <div className="text-xs text-white/50">{visibleItems.length} thread(s)</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
            <div className="space-y-2">
              {visibleItems.length === 0 ? (
                <div className="p-4 text-sm text-white/60">No results for “{q}”.</div>
              ) : (
                visibleItems.map((t) => {
                  const active = t.threadId === previewThreadId;
                  const unread = unreadCountByThread.get(t.threadId) || 0;

                  return (
                    <Link
                      key={t.threadId}
                      href={`/members/inbox/${t.threadId}`}
                      className={[
                        "block rounded-2xl border p-4 transition",
                        active
                          ? "border-white/20 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-tight flex items-center gap-2">
                            <span className="truncate">{t.otherName}</span>

                            {unread > 0 ? (
                              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-black">
                                {unread}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/60">
                                read
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-white/60 truncate">{t.lastBody}</div>
                        </div>

                        <div className="text-xs text-white/50 whitespace-nowrap">{formatShort(t.lastAt)}</div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <span className="btn btnGhost text-xs px-3 py-1">Open broMAIL →</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:col-span-7">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-white/80">Preview</div>

            {previewThreadId ? (
              <Link href={`/members/inbox/${previewThreadId}`} className="btn btnPrimary">
                broREPLY →
              </Link>
            ) : (
              <span className="text-xs text-white/50">No thread selected</span>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-2">
              {previewThreadId === null ? (
                <div className="text-sm text-white/70">Pick a thread to preview.</div>
              ) : preview.length === 0 ? (
                <div className="text-sm text-white/70">No messages yet.</div>
              ) : (
                preview.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                          mine ? "bg-white text-black" : "bg-[#0b0b12] border border-white/10",
                        ].join(" ")}
                      >
                        <div className="whitespace-pre-wrap">{m.body}</div>
                        <div className={`mt-2 text-[11px] ${mine ? "text-black/60" : "text-white/50"}`}>
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-white/60">Open a thread for full view + sending.</div>

              {previewThreadId ? (
                <Link href={`/members/inbox/${previewThreadId}`} className="btn btnGhost">
                  Full broMAIL →
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/** ---------- UI (matches your dark + glass vibe) ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">{children}</div>
    </div>
  );
}

function Header({ myName }: { myName: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs tracking-widest text-white/50">broTHER collecTive</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">broMAIL</h1>
        <p className="mt-2 text-sm text-white/70">
          What&apos;s up, <span className="text-white/90 font-medium">{myName}</span>.
        </p>
      </div>

      <div className="flex gap-2">
        <Link href="/members" className="btn btnGhost">
          ← Back
        </Link>
      </div>
    </div>
  );
}

function ActionsRow() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <Link href="/members/directory" className="btn btnPrimary">
        Write broMAIL
      </Link>
      <Link href="/members/chat" className="btn btnGhost">
        broCHAT
      </Link>
      <Link href="/members/support" className="btn btnGhost">
        Request Support
      </Link>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">{children}</div>;
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
      No broMAIL yet. Hit <span className="text-white/90 font-medium">Write broMAIL</span> to start one.
    </div>
  );
}
