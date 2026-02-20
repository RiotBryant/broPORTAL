"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

function pickName(p: ProfileLite | null) {
  if (!p) return "broTHER";
  return p.display_name || p.full_name || p.email || "broTHER";
}

export default function ComposeBroMailPage() {
  const router = useRouter();

  const [meId, setMeId] = useState<string | null>(null);
  const [meName, setMeName] = useState("broTHER");

  const [toQuery, setToQuery] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [toUser, setToUser] = useState<ProfileLite | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return router.replace("/login?redirect=/members/inbox/compose");

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return router.replace("/login?redirect=/members/inbox/compose");
      setMeId(uid);

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .eq("id", uid)
        .maybeSingle();

      setMeName(pickName((myProfile as any) || null));
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      const q = toQuery.trim();
      if (!q || q.length < 2) {
        setResults([]);
        return;
      }

      // lightweight search: name or email
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .or(`display_name.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);

      setResults((data as any) || []);
    })();
  }, [toQuery]);

  async function send() {
    setErr(null);

    if (!meId) return setErr("Not logged in.");
    if (!toUser?.id) return setErr("Pick who you’re sending to.");
    if (!subject.trim()) return setErr("Subject is required.");
    if (!body.trim()) return setErr("Message is empty.");

    setSaving(true);
    try {
      // 1) Create thread
      const { data: threadRow, error: threadErr } = await supabase
        .from("dm_threads")
        .insert({ subject: subject.trim() })
        .select("id")
        .single();

      if (threadErr) throw threadErr;

      const threadId = (threadRow as any).id as string;

      // 2) Add members (me + them)
      const { error: mErr } = await supabase.from("dm_thread_members").insert([
        { thread_id: threadId, user_id: meId },
        { thread_id: threadId, user_id: toUser.id },
      ]);

      if (mErr) throw mErr;

      // 3) Add first message
      const { error: msgErr } = await supabase.from("dm_messages").insert({
        thread_id: threadId,
        sender_id: meId,
        body: body.trim(),
      });

      if (msgErr) throw msgErr;

      // 4) Update last_message_at
      await supabase.from("dm_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);

      // 5) Mark read for sender (so you don’t see your own as unread)
      await supabase.from("dm_thread_reads").upsert(
        { thread_id: threadId, user_id: meId, last_read_at: new Date().toISOString() },
        { onConflict: "thread_id,user_id" }
      );

      router.replace(`/members/inbox/${threadId}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to send.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-white/50">broTHER collecTive</div>
            <div className="text-lg font-semibold">Compose broMAIL</div>
            <div className="mt-1 text-xs text-white/60">
              From: <span className="text-white/80">{meName}</span>
            </div>
          </div>

          <Link href="/members/inbox" className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm transition border border-white/15 hover:bg-white/10">
            ← Back
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 space-y-3">
            {/* TO */}
            <div>
              <div className="text-xs text-white/60 mb-1">To</div>
              {toUser ? (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-sm">
                    {pickName(toUser)} <span className="text-white/50 text-xs">({toUser.email || "no email"})</span>
                  </div>
                  <button
                    className="text-xs text-white/70 hover:text-white"
                    onClick={() => {
                      setToUser(null);
                      setToQuery("");
                      setResults([]);
                    }}
                  >
                    change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={toQuery}
                    onChange={(e) => setToQuery(e.target.value)}
                    placeholder="Search a broTHER by name or email…"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                  {results.length > 0 ? (
                    <div className="mt-2 rounded-xl border border-white/10 bg-[#0b0b12] overflow-hidden">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 hover:bg-white/5 border-b border-white/10 last:border-b-0"
                          onClick={() => setToUser(p)}
                        >
                          <div className="text-sm text-white/90">{pickName(p)}</div>
                          <div className="text-xs text-white/60">{p.email || ""}</div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* SUBJECT */}
            <div>
              <div className="text-xs text-white/60 mb-1">Subject</div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>

            {/* BODY */}
            <div>
              <div className="text-xs text-white/60 mb-1">Message</div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your broMAIL…"
                rows={10}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
              />
            </div>

            {err ? <div className="text-sm text-red-300">{err}</div> : null}

            <div className="flex gap-2">
              <button
                onClick={send}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm transition border border-white/20 bg-white text-black hover:bg-white/90 disabled:opacity-60"
              >
                {saving ? "Sending…" : "Send broMAIL"}
              </button>

              <Link
                href="/members/inbox"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm transition border border-white/15 hover:bg-white/10"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
