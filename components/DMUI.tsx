"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  dmCreateOrGetThread,
  dmListMessages,
  dmListThreads,
  dmListDirectory,
  dmSendMessage,
  type DMThreadRow,
} from "@/app/members/dm/_actions";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export default function DMUI(props: { initialThreadId?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  const [meId, setMeId] = React.useState<string | null>(null);

  const [threads, setThreads] = React.useState<DMThreadRow[]>([]);
  const [directory, setDirectory] = React.useState<{ id: string; display_name: string }[]>([]);

  const [active, setActive] = React.useState<string | null>(props.initialThreadId ?? null);
  const [items, setItems] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function loadThreads() {
    setLoadingThreads(true);
    setErr(null);
    try {
      const [t, d] = await Promise.all([dmListThreads(), dmListDirectory()]);
      setThreads(t);
      setDirectory(d);

      // If no active chosen yet, pick first thread
      if (!active && t.length) setActive(t[0].id);
    } catch (e: any) {
      setErr(e?.message ?? "Failed loading threads.");
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadMessages(threadId: string) {
    setLoadingMsgs(true);
    setErr(null);
    try {
      const data = await dmListMessages(threadId);
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed loading messages.");
    } finally {
      setLoadingMsgs(false);
    }
  }

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMeId(data.user?.id ?? null);
      await loadThreads();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!active) return;
    loadMessages(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Realtime: listen for new messages in active thread
  React.useEffect(() => {
    if (!active) return;

    const channel = supabase
      .channel(`dm_messages_${active}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${active}` },
        (payload) => {
          const row = payload.new as any;
          setItems((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { id: row.id, sender_id: row.sender_id, body: row.body, created_at: row.created_at }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [active, supabase]);

  async function startThread(otherUserId: string) {
    setErr(null);
    try {
      const tid = await dmCreateOrGetThread(otherUserId);
      // Refresh threads so it appears in the list with correct name + ordering
      await loadThreads();
      setActive(tid);
      router.push(`/members/dm/${tid}`);
    } catch (e: any) {
      setErr(e?.message ?? "Could not start DM.");
    }
  }

  async function send() {
    if (!active) return;
    const clean = text.trim();
    if (!clean) return;

    setErr(null);
    setText("");
    try {
      await dmSendMessage(active, clean);
      // realtime will append it; if realtime is slow, you can also force reload
    } catch (e: any) {
      setErr(e?.message ?? "Send failed.");
      setText(clean); // put it back
    }
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Direct Messages</h1>
            <p className="mt-2 text-sm text-white/70">Real threads + real messages + realtime inserts.</p>
          </div>
          <Link href="/members" className="text-sm text-white/70 hover:text-white">
            ← Back to Portal
          </Link>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: "1fr 2fr" }}>
          {/* LEFT: THREADS */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Threads</div>
              <button
                className="text-xs text-white/60 hover:text-white"
                onClick={loadThreads}
                disabled={loadingThreads}
              >
                Refresh
              </button>
            </div>

            {loadingThreads ? (
              <div className="mt-3 text-sm text-white/60">Loading…</div>
            ) : threads.length ? (
              <div className="mt-3 grid gap-2">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActive(t.id);
                      router.push(`/members/dm/${t.id}`);
                    }}
                    className="w-full rounded-full border border-white/10 px-3 py-2 text-left hover:border-white/20"
                    style={{
                      background: active === t.id ? "rgba(255,255,255,0.08)" : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t.other_display_name}</div>
                      <div className="text-xs text-white/50">
                        {t.last_at ? new Date(t.last_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-white/60 line-clamp-1">
                      {t.last_body ?? "No messages yet"}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-white/60">No threads yet.</div>
            )}

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="text-xs text-white/60">Start new DM</div>
              <div className="mt-2 grid gap-2">
                {directory.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    className="w-full rounded-full border border-white/10 px-3 py-2 text-left text-sm hover:border-white/20"
                    onClick={() => startThread(p.id)}
                  >
                    {p.display_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: MESSAGES */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">{active ? "Conversation" : "Select a thread"}</div>

            <div className="mt-3 max-h-[55vh] overflow-auto rounded-xl border border-white/10 bg-black/10 p-3">
              {!active ? (
                <div className="text-sm text-white/60">Pick a thread on the left.</div>
              ) : loadingMsgs ? (
                <div className="text-sm text-white/60">Loading messages…</div>
              ) : items.length ? (
                <div className="grid gap-3">
                  {items.map((m) => {
                    const mine = meId && m.sender_id === meId;
                    return (
                      <div key={m.id} className={mine ? "text-right" : "text-left"}>
                        <div className="text-xs text-white/50">
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                        <div
                          className="inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                          style={{
                            background: mine ? "rgba(31,78,216,0.30)" : "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.10)",
                          }}
                        >
                          {m.body}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-white/60">No messages yet.</div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={active ? "Write a message…" : "Select a thread first"}
                disabled={!active}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
                onClick={send}
                disabled={!active || !text.trim()}
              >
                Send
              </button>
              <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href="/members/chat">
                Group Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
