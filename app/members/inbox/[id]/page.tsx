"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

type MsgRow = {
  id: string;
  created_at: string;
  thread_id: string;
  sender_id: string;
  body: string;
};

function pickName(p: ProfileLite | null) {
  return p?.display_name || p?.full_name || p?.email || "broTHER";
}

export default function BroMailThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const threadId = params.id;

  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string>("");
  const [meName, setMeName] = useState<string>("broTHER");
  const [otherName, setOtherName] = useState<string>("broTHER");

  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => text.trim().length > 0 && !saving, [text, saving]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      // Must be logged in
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return router.replace("/login");

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return router.replace("/login");
      setMeId(uid);

      // Get my profile name for greeting
      const { data: myProf } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .eq("id", uid)
        .maybeSingle();

      setMeName(pickName((myProf as any) || null));

      // Guard: confirm I am in this thread (RLS should enforce too)
      const { data: membership, error: memErr } = await supabase
        .from("dm_thread_members")
        .select("thread_id, user_id")
        .eq("thread_id", threadId)
        .eq("user_id", uid)
        .maybeSingle();

      if (memErr) console.error(memErr);
      if (!membership) {
        router.replace("/members/inbox");
        return;
      }

      // Find the other user (for the header)
      const { data: members, error: membersErr } = await supabase
        .from("dm_thread_members")
        .select("user_id")
        .eq("thread_id", threadId);

      if (membersErr) console.error(membersErr);

      const otherId = (members || []).map((m: any) => m.user_id).find((x: string) => x !== uid);

      if (otherId) {
        const { data: otherProf } = await supabase
          .from("profiles")
          .select("id, display_name, full_name, email")
          .eq("id", otherId)
          .maybeSingle();

        setOtherName(pickName((otherProf as any) || null));
      }

      // Load messages
      await loadMessages(threadId);

      // Realtime: updates when new message arrives
      const channel = supabase
        .channel(`broMAIL:${threadId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
          async () => {
            await loadMessages(threadId);
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(channel);
      };
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  async function loadMessages(tid: string) {
    const { data, error } = await supabase
      .from("dm_messages")
      .select("id, created_at, thread_id, sender_id, body")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setErr(error.message);
      return;
    }

    setMsgs((data || []) as MsgRow[]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function send() {
    setErr(null);
    const clean = text.trim();
    if (!clean) return;

    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return router.replace("/login");

      const { error: insErr } = await supabase.from("dm_messages").insert({
        thread_id: threadId,
        sender_id: uid,
        body: clean,
      });

      if (insErr) throw insErr;

      setText("");
      await loadMessages(threadId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white grid place-items-center">
        <div className="opacity-70 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/members/inbox" className="text-sm text-white/70 hover:text-white">
          ← Back to broMAIL
        </Link>

        <div className="mt-4">
          <div className="text-xs tracking-widest text-white/50">broMAIL</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            What&apos;s up, {meName}.
          </h1>
          <div className="mt-2 text-sm text-white/60">
            Thread with <span className="text-white/85 font-medium">{otherName}</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 text-xs text-white/60 bg-white/5 border-b border-white/10">
            Messages
          </div>

          <div className="px-4 py-4 space-y-3 max-h-[55vh] overflow-y-auto pr-2">
            {msgs.length === 0 ? (
              <div className="text-sm text-white/60">No messages yet. Send the first broMAIL.</div>
            ) : (
              msgs.map((m) => {
                const mine = m.sender_id === meId;
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
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Write broMAIL</div>
            <Link href="/members/directory" className="btn btnGhost">
              Find a broTHER
            </Link>
          </div>

          <textarea
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm outline-none"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Send a broMAIL to ${otherName}…`}
          />

          {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}

          <div className="mt-3 flex gap-2">
            <button
              onClick={send}
              disabled={!canSend}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm disabled:opacity-40"
            >
              {saving ? "Sending…" : "Send broMAIL"}
            </button>

            <Link href="/members/inbox" className="rounded-xl border border-white/15 px-4 py-2 text-sm">
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
