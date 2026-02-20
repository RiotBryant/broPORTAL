"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ThreadRow = {
  id: string;
  subject: string | null;
};

type MemberRow = {
  thread_id: string;
  user_id: string;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

type MsgRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

function pickName(p: ProfileLite | null) {
  if (!p) return "broTHER";
  return p.display_name || p.full_name || p.email || "broTHER";
}

export default function BroMailThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const threadId = params.id;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [meProfile, setMeProfile] = useState<ProfileLite | null>(null);

  const [thread, setThread] = useState<ThreadRow | null>(null);
  const [otherProfile, setOtherProfile] = useState<ProfileLite | null>(null);

  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const meName = useMemo(() => pickName(meProfile), [meProfile]);
  const otherName = useMemo(() => pickName(otherProfile), [otherProfile]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return router.replace(`/login?redirect=/members/inbox/${threadId}`);

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return router.replace(`/login?redirect=/members/inbox/${threadId}`);
      setMeId(uid);

      const { data: myP } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .eq("id", uid)
        .maybeSingle();
      setMeProfile((myP as any) || null);

      // Thread subject
      const { data: tRow } = await supabase
        .from("dm_threads")
        .select("id, subject")
        .eq("id", threadId)
        .maybeSingle();
      setThread((tRow as any) || null);

      // Members (to find the other person)
      const { data: members } = await supabase
        .from("dm_thread_members")
        .select("thread_id, user_id")
        .eq("thread_id", threadId);

      const otherId = ((members as any[]) || []).find((m) => m.user_id !== uid)?.user_id || null;

      if (otherId) {
        const { data: op } = await supabase
          .from("profiles")
          .select("id, display_name, full_name, email")
          .eq("id", otherId)
          .maybeSingle();
        setOtherProfile((op as any) || null);
      }

      // Messages
      const { data: m } = await supabase
        .from("dm_messages")
        .select("id, thread_id, sender_id, body, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      setMsgs((m as any) || []);
      setLoading(false);

      // Mark read (clears unread badge)
      await supabase.from("dm_thread_reads").upsert(
        { thread_id: threadId, user_id: uid, last_read_at: new Date().toISOString() },
        { onConflict: "thread_id,user_id" }
      );

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    })();
  }, [router, threadId]);

  async function send() {
    setErr(null);
    const clean = text.trim();
    if (!clean) return;

    if (!meId) return router.replace(`/login?redirect=/members/inbox/${threadId}`);

    setSaving(true);
    try {
      const { error } = await supabase.from("dm_messages").insert({
        thread_id: threadId,
        sender_id: meId,
        body: clean,
      });
      if (error) throw error;

      await supabase.from("dm_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);

      const { data: m } = await supabase
        .from("dm_messages")
        .select("id, thread_id, sender_id, body, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      setMsgs((m as any) || []);
      setText("");

      await supabase.from("dm_thread_reads").upsert(
        { thread_id: threadId, user_id: meId, last_read_at: new Date().toISOString() },
        { onConflict: "thread_id,user_id" }
      );

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e: any) {
      setErr(e?.message || "Failed to send.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white grid place-items-center">
        <div className="text-sm text-white/70">Loading broMAIL…</div>
      </div>
    );
  }

  const subject = (thread?.subject || "").trim() || "(no subject)";

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Top bar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/members/inbox"
              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm transition border border-white/15 hover:bg-white/10"
            >
              ← Back
            </Link>

            <div>
              <div className="text-xs tracking-widest text-white/50">broMAIL</div>
              <div className="text-sm text-white/80">What&apos;s up, {meName}.</div>
            </div>
          </div>

          <Link
            href="/members/inbox/compose"
            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm transition border border-white/20 bg-white text-black hover:bg-white/90"
          >
            + Compose
          </Link>
        </div>

        {/* Message header */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="text-xl font-semibold">{subject}</div>
            <div className="mt-2 text-sm text-white/70">
              <div>
                <span className="text-white/50">From:</span> {meName}{" "}
                <span className="text-white/50"> • To:</span> {otherName}
              </div>
            </div>
          </div>

          {/* Thread */}
          <div className="p-5 space-y-3 max-h-[55vh] overflow-y-auto">
            {msgs.length === 0 ? (
              <div className="text-sm text-white/70">No messages yet.</div>
            ) : (
              msgs.map((m) => {
                const mine = m.sender_id === meId;
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
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="px-5 py-4 border-t border-white/10 bg-black/10">
            <div className="text-sm font-medium text-white/85">Reply</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Write a broMAIL to ${otherName}…`}
              rows={5}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
            />
            {err ? <div className="mt-2 text-sm text-red-300">{err}</div> : null}
            <div className="mt-3 flex gap-2">
              <button
                onClick={send}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm transition border border-white/20 bg-white text-black hover:bg-white/90 disabled:opacity-60"
              >
                {saving ? "Sending…" : "Send"}
              </button>
              <Link
                href="/members/inbox"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm transition border border-white/15 hover:bg-white/10"
              >
                Back to broBOX
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
