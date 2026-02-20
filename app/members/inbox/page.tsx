import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import BroMailSearch from "./BroMailSearch";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

type MessageRow = {
  thread_id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
};

type ThreadItem = {
  threadId: string;
  otherName: string;
  lastBody: string;
  lastAt: string | null;
  lastSenderId: string | null;
  unreadCount: number;
};

function pickName(p: ProfileLite | null) {
  return p?.display_name || p?.full_name || p?.email || "broTHER";
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
  searchParams: { q?: string; box?: "inbox" | "sent" };
}) {
  const q = (searchParams?.q || "").toLowerCase().trim();
  const box = (searchParams?.box || "inbox") as "inbox" | "sent";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/members/inbox");

  // My name for greeting
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const myName = pickName((myProfile as any) || null);

  // Threads I belong to
  const { data: myThreads, error: threadsErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", user.id);

  if (threadsErr) {
    return (
      <Shell>
        <TopBar myName={myName} />
        <Frame>
          <Sidebar active={box} q={q} />
          <Main>
            <EmptyPanel title="broMAIL couldn’t load." subtitle="RLS likely blocking dm_thread_members." />
          </Main>
        </Frame>
      </Shell>
    );
  }

  const threadIds = (myThreads || []).map((r: any) => r.thread_id).filter(Boolean);

  // If no threads, show Gmail-style empty state
  if (threadIds.length === 0) {
    return (
      <Shell>
        <TopBar myName={myName} />
        <Frame>
          <Sidebar active={box} q={q} />
          <Main>
            <InboxHeader q={q} box={box} />
            <GmailEmpty />
          </Main>
        </Frame>
      </Shell>
    );
  }

  // Read tracking for unread counts
  const { data: reads } = await supabase
    .from("dm_thread_reads")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id);

  const readByThread = new Map<string, string>();
  for (const r of reads || []) readByThread.set((r as any).thread_id, (r as any).last_read_at);

  // Members so we can find the "other" person
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

  // Pull recent messages (for last message + unread math)
  const { data: recentMsgs } = await supabase
    .from("dm_messages")
    .select("thread_id, sender_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false })
    .limit(600);

  // last message per thread
  const lastByThread = new Map<string, MessageRow>();
  for (const m of (recentMsgs || []) as any[]) {
    if (!m.thread_id) continue;
    if (lastByThread.has(m.thread_id)) continue;
    lastByThread.set(m.thread_id, m as MessageRow);
  }

  // unread counts per thread (messages from OTHER after last_read_at)
  const unreadByThread = new Map<string, number>();
  for (const m of (recentMsgs || []) as any[]) {
    const tid = m.thread_id as string;
    if (!tid) continue;
    if (m.sender_id === user.id) continue;

    const lastRead = readByThread.get(tid);
    if (!lastRead) {
      unreadByThread.set(tid, (unreadByThread.get(tid) || 0) + 1);
      continue;
    }
    if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
      unreadByThread.set(tid, (unreadByThread.get(tid) || 0) + 1);
    }
  }

  // Build thread items
  let items: ThreadItem[] = threadIds.map((tid) => {
    const otherId = otherByThread.get(tid);
    const otherName = otherId ? nameByUser.get(otherId) || "broTHER" : "broTHER";
    const last = lastByThread.get(tid);
    return {
      threadId: tid,
      otherName,
      lastBody: last?.body ? clamp(last.body, 120) : "No messages yet.",
      lastAt: last?.created_at || null,
      lastSenderId: last?.sender_id || null,
      unreadCount: unreadByThread.get(tid) || 0,
    };
  });

  // Sort newest first
  items.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });

  // “Sent” view: show threads whose LAST message was sent by me
  if (box === "sent") {
    items = items.filter((t) => t.lastSenderId === user.id);
  }

  // Search filter (name or last message)
  if (q) {
    items = items.filter((t) => {
      const a = (t.otherName || "").toLowerCase();
      const b = (t.lastBody || "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }

  return (
    <Shell>
      <TopBar myName={myName} />
      <Frame>
        <Sidebar active={box} q={q} />
        <Main>
          <InboxHeader q={q} box={box} />
          {items.length === 0 ? (
            <GmailEmpty />
          ) : (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="divide-y divide-white/10">
                {items.map((t) => (
                  <Link
                    key={t.threadId}
                    href={`/members/inbox/${t.threadId}`}
                    className="block px-4 py-3 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      {/* Unread dot */}
                      <div className="w-2 h-2 rounded-full">
                        {box === "inbox" && t.unreadCount > 0 ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-transparent" />
                        )}
                      </div>

                      {/* Sender + preview */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-white/90 truncate">{t.otherName}</div>

                          {box === "inbox" && t.unreadCount > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-black">
                              {t.unreadCount}
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs text-white/60 truncate">{t.lastBody}</div>
                      </div>

                      {/* Time */}
                      <div className="text-xs text-white/50 whitespace-nowrap">
                        {formatShort(t.lastAt)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Main>
      </Frame>
    </Shell>
  );
}

/* ---------------- UI (Gmail-like frame, your colors) ---------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#07070b] text-white">{children}</div>;
}

function TopBar({ myName }: { myName: string }) {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#07070b]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Back button replaces hamburger */}
          <Link
            href="/members"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            aria-label="Back"
          >
            ← Back
          </Link>

          <div className="min-w-0">
            <div className="text-xs tracking-widest text-white/50">broTHER collecTive</div>
            <div className="text-xl font-semibold tracking-tight">broMAIL</div>
            <div className="text-sm text-white/60">
              What&apos;s up, <span className="text-white/85 font-medium">{myName}</span>.
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="w-full max-w-xl">
            <BroMailSearch />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">{children}</div>
    </div>
  );
}

function Sidebar({ active, q }: { active: "inbox" | "sent"; q: string }) {
  const base =
    "block rounded-xl px-3 py-2 text-sm border transition";
  const on =
    "border-white/20 bg-white/10 text-white";
  const off =
    "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white";

  return (
    <div className="lg:col-span-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-white/50 mb-2">broMAIL</div>

        <nav className="space-y-2">
          <Link
            href={`/members/inbox?box=inbox${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`${base} ${active === "inbox" ? on : off}`}
          >
            broBOX
          </Link>

          <Link
            href={`/members/inbox?box=sent${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`${base} ${active === "sent" ? on : off}`}
          >
            Sent
          </Link>
        </nav>
      </div>
    </div>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return <div className="lg:col-span-9">{children}</div>;
}

function InboxHeader({ q, box }: { q: string; box: "inbox" | "sent" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-white/85">{box === "sent" ? "Sent" : "broBOX"}</div>
        {q ? <div className="text-xs text-white/50 mt-1">Filtered by: “{q}”</div> : null}
      </div>

      {/* Optional: keep this clean for now. No extra prompts. */}
    </div>
  );
}

function GmailEmpty() {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
      <div className="text-white/80 font-medium">No new broMAIL!</div>
      <div className="mt-2 text-sm text-white/55">Your broBOX is quiet right now.</div>
    </div>
  );
}

function EmptyPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-white/85 font-medium">{title}</div>
      <div className="mt-2 text-sm text-white/60">{subtitle}</div>
    </div>
  );
}
