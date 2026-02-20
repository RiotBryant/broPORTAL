import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

type MsgLite = {
  thread_id: string;
  sender_id: string;
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

function formatListTime(iso: string) {
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
  searchParams: { q?: string; tab?: string };
}) {
  const q = (searchParams?.q || "").toLowerCase().trim();
  const tab = (searchParams?.tab || "inbox").toLowerCase(); // "inbox" | "sent"
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/members/inbox");

  // Greeting name
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const myName = pickName((myProfile as any) || null);

  // My thread IDs
  const { data: myThreads, error: threadsErr } = await supabase
    .from("dm_thread_members")
    .select("thread_id")
    .eq("user_id", user.id);

  if (threadsErr) {
    return (
      <Shell>
        <TopBar myName={myName} q={q} tab={tab} />
        <MainCard>
          <div className="text-sm text-white/80">broMAIL couldn’t load.</div>
          <div className="mt-2 text-xs text-white/60">
            This is usually RLS blocking <code className="text-white/80">dm_thread_members</code>.
          </div>
        </MainCard>
      </Shell>
    );
  }

  const threadIds = (myThreads || []).map((r: any) => r.thread_id).filter(Boolean);

  // No threads yet
  if (threadIds.length === 0) {
    return (
      <Shell>
        <TopBar myName={myName} q={q} tab={tab} />
        <MailLayout>
          <SideNav activeTab={tab} />
          <div className="col-span-12 lg:col-span-9">
            <MainCard>
              <div className="text-sm text-white/80">No new broMAIL.</div>
              <div className="mt-2 text-xs text-white/60">Hit Compose to start one.</div>
            </MainCard>
          </div>
        </MailLayout>
      </Shell>
    );
  }

  // Read tracking
  const { data: reads } = await supabase
    .from("dm_thread_reads")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id);

  const readByThread = new Map<string, string>();
  for (const r of reads || []) readByThread.set((r as any).thread_id, (r as any).last_read_at);

  // Thread -> other user
  const { data: memberRows } = await supabase
    .from("dm_thread_members")
    .select("thread_id, user_id")
    .in("thread_id", threadIds);

  const otherByThread = new Map<string, string>();
  for (const m of memberRows || []) {
    if (!m?.thread_id || !m?.user_id) continue;
    if (m.user_id !== user.id) otherByThread.set(m.thread_id, m.user_id);
  }

  const otherUserIds = Array.from(new Set(Array.from(otherByThread.values())));

  // Names
  const { data: others } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email")
    .in("id", otherUserIds);

  const nameByUser = new Map<string, string>();
  for (const p of (others || []) as ProfileLite[]) nameByUser.set(p.id, pickName(p));

  // Subjects
  const { data: threadRows } = await supabase
    .from("dm_threads")
    .select("id, subject")
    .in("id", threadIds);

  const subjectByThread = new Map<string, string>();
  for (const t of (threadRows || []) as any[]) subjectByThread.set(t.id, (t.subject || "").trim());

  // Pull recent messages (enough to compute last message + unread counts)
  const { data: recentMsgs } = await supabase
    .from("dm_messages")
    .select("thread_id, sender_id, body, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false })
    .limit(1200);

  const lastByThread = new Map<string, MsgLite>();
  const unreadByThread = new Map<string, number>();

  for (const m of (recentMsgs || []) as MsgLite[]) {
    if (!m.thread_id) continue;

    // last message per thread
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);

    // unread: messages from OTHER person after my last_read_at
    const lastRead = readByThread.get(m.thread_id);
    const isAfterRead = !lastRead || new Date(m.created_at).getTime() > new Date(lastRead).getTime();
    const fromOther = m.sender_id !== user.id;

    if (isAfterRead && fromOther) {
      unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) || 0) + 1);
    }
  }

  // Build list
  let items = threadIds.map((tid) => {
    const otherId = otherByThread.get(tid) || null;
    const otherName = otherId ? nameByUser.get(otherId) || "broTHER" : "broTHER";
    const subject = subjectByThread.get(tid) || "";
    const last = lastByThread.get(tid);

    return {
      threadId: tid,
      otherName,
      subject: subject || "(no subject)",
      snippet: last?.body ? clamp(last.body, 90) : "No messages yet.",
      lastAt: last?.created_at || null,
      lastSenderId: last?.sender_id || null,
      unread: unreadByThread.get(tid) || 0,
    };
  });

  // Sent tab filter
  if (tab === "sent") {
    items = items.filter((x) => x.lastSenderId === user.id);
  }

  // Search filter
  if (q) {
    items = items.filter((x) => {
      const hay = `${x.otherName} ${x.subject} ${x.snippet}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Sort by newest
  items.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });

  const activeThreadId = items[0]?.threadId || items[0]?.threadId;

  // Preview messages for right panel
  const { data: previewMsgs } = await supabase
    .from("dm_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", activeThreadId)
    .order("created_at", { ascending: false })
    .limit(18);

  const preview = (previewMsgs || []).reverse() as any[];

  return (
    <Shell>
      <TopBar myName={myName} q={q} tab={tab} />

      <MailLayout>
        <SideNav activeTab={tab} />

        {/* LIST + PREVIEW */}
        <div className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-12 gap-4">
            {/* Thread list */}
            <div className="col-span-12 lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="text-sm font-medium text-white/85">broBOX</div>
                  <div className="text-xs text-white/50">{items.length} thread(s)</div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-sm text-white/70">No matching broMAIL.</div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {items.map((t) => {
                        const isUnread = t.unread > 0;
                        return (
                          <Link
                            key={t.threadId}
                            href={`/members/inbox/${t.threadId}`}
                            className="block px-4 py-3 hover:bg-white/5 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={`truncate text-sm ${isUnread ? "font-semibold text-white" : "text-white/85"}`}>
                                    {t.otherName}
                                  </div>
                                  {isUnread ? (
                                    <span className="inline-flex items-center rounded-full bg-white text-black text-[11px] px-2 py-[2px]">
                                      {t.unread}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full border border-white/15 text-white/60 text-[11px] px-2 py-[2px]">
                                      read
                                    </span>
                                  )}
                                </div>

                                <div className={`mt-1 truncate text-sm ${isUnread ? "text-white/90" : "text-white/70"}`}>
                                  {t.subject}
                                </div>
                                <div className="mt-1 truncate text-xs text-white/55">{t.snippet}</div>
                              </div>

                              <div className="text-xs text-white/50 whitespace-nowrap">
                                {t.lastAt ? formatListTime(t.lastAt) : ""}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="col-span-12 lg:col-span-7">
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="text-sm font-medium text-white/85">Preview</div>
                  {activeThreadId ? (
                    <Link href={`/members/inbox/${activeThreadId}`} className="btnPrimary">
                      Open →
                    </Link>
                  ) : null}
                </div>

                <div className="p-4 max-h-[65vh] overflow-y-auto space-y-3">
                  {preview.length === 0 ? (
                    <div className="text-sm text-white/70">No messages yet.</div>
                  ) : (
                    preview.map((m) => {
                      const mine = m.sender_id === user.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={[
                              "max-w-[88%] rounded-2xl px-4 py-3 text-sm border",
                              mine
                                ? "bg-white text-black border-white/20"
                                : "bg-[#0b0b12] text-white border-white/10",
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

                {activeThreadId ? (
                  <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-white/60">Open the thread to reply.</div>
                    <Link href={`/members/inbox/${activeThreadId}`} className="btnGhost">
                      Reply →
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </MailLayout>
    </Shell>
  );
}

/* ---------------- UI ---------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}

function MailLayout({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid grid-cols-12 gap-4">{children}</div>;
}

function TopBar({ myName, q, tab }: { myName: string; q: string; tab: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
      <Link href="/members" className="btnGhost">
        ← Back
      </Link>

      <div className="flex flex-col">
        <div className="text-xs tracking-widest text-white/50">broTHER collecTive</div>
        <div className="text-lg font-semibold leading-tight">broMAIL</div>
      </div>

      <div className="flex-1" />

      <div className="hidden md:block text-sm text-white/70">
        What&apos;s up, <span className="text-white/90 font-medium">{myName}</span>.
      </div>

      <form className="ml-3 w-[320px] max-w-full" action="/members/inbox" method="get">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search broMAIL"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        />
      </form>
    </div>
  );
}

function SideNav({ activeTab }: { activeTab: string }) {
  return (
    <div className="col-span-12 lg:col-span-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-3">
          <Link href="/members/inbox/compose" className="btnCompose">
            + Compose
          </Link>
        </div>

        <div className="border-t border-white/10">
          <NavItem href="/members/inbox?tab=inbox" label="broBOX" active={activeTab !== "sent"} />
          <NavItem href="/members/inbox?tab=sent" label="Sent" active={activeTab === "sent"} />
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "block px-4 py-3 text-sm transition",
        active ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function MainCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5">{children}</div>;
}

/* Buttons (on-brand + consistent) */
const btnBase =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm transition border";

function Btn({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`${btnBase} ${className}`}>{children}</span>;
}

// Tailwind “button classes”
declare global {
  // eslint-disable-next-line no-var
  var __btn: never;
}

function StylesHack() {
  return null;
}

const btnPrimaryClass = "bg-white text-black border-white/20 hover:bg-white/90";
const btnGhostClass = "bg-transparent text-white border-white/15 hover:bg-white/10";
const btnComposeClass = "w-full bg-white text-black border-white/20 hover:bg-white/90";

function _unused() {
  return (
    <>
      <Btn className={btnPrimaryClass}>x</Btn>
      <Btn className={btnGhostClass}>x</Btn>
      <Btn className={btnComposeClass}>x</Btn>
    </>
  );
}

// small helpers to use as className on Links
function btnPrimary() {
  return `${btnBase} ${btnPrimaryClass}`;
}
function btnGhost() {
  return `${btnBase} ${btnGhostClass}`;
}
function btnCompose() {
  return `${btnBase} ${btnComposeClass}`;
}

// attach as string props
const btnPrimary = btnPrimary();
const btnGhost = btnGhost();
const btnCompose = btnCompose();

// @ts-ignore
(globalThis as any).btnPrimary = btnPrimary;
// @ts-ignore
(globalThis as any).btnGhost = btnGhost;
// @ts-ignore
(globalThis as any).btnCompose = btnCompose;

// Use these in JSX via className
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const btnPrimaryExport = btnPrimary;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const btnGhostExport = btnGhost;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const btnComposeExport = btnCompose;

// Make them available in this module scope
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const btnPrimary2 = btnPrimary;

// These are referenced above:
const btnPrimary = `${btnBase} ${btnPrimaryClass}`;
const btnGhost = `${btnBase} ${btnGhostClass}`;
const btnCompose = `${btnBase} ${btnComposeClass}`;

// And these too:
const btnPrimaryName = "btnPrimary";
const btnGhostName = "btnGhost";
const btnComposeName = "btnCompose";

// TS won’t create CSS classes; we use strings directly:
