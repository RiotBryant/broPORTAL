
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ReqRow = {
  id: string;
  created_at: string;
  created_by: string;
  category: string | null;
  subject: string | null;
  body: string | null;
  status: string | null;
  last_updated: string | null;
};

type MsgRow = {
  id: string;
  created_at: string;
  request_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
};

export default function MemberThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<ReqRow | null>(null);
  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return router.replace("/login");

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return router.replace("/login");

      const { data: reqRow, error: reqErr } = await supabase
        .from("requests")
        .select("id, created_at, created_by, category, subject, body, status, last_updated")
        .eq("id", id)
        .single();

      if (reqErr) console.error(reqErr);

      // Guard: only owner can view (RLS should also enforce)
      if ((reqRow as any)?.created_by && (reqRow as any).created_by !== uid) {
        router.replace("/members/inbox");
        return;
      }

      setReq(reqRow as any);

      const { data: m, error: msgErr } = await supabase
        .from("request_messages")
        .select("id, created_at, request_id, author_id, body, is_internal")
        .eq("request_id", id)
        .order("created_at", { ascending: true });

      if (msgErr) console.error(msgErr);

      // members should not see internal notes
      const visible = ((m ?? []) as MsgRow[]).filter((x) => !x.is_internal);
      setMsgs(visible);

      setLoading(false);
    })();
  }, [id, router]);

  async function sendReply() {
    setErr(null);
    const clean = reply.trim();
    if (!clean) return;

    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return router.replace("/login");

      const { error: insErr } = await supabase.from("request_messages").insert({
        request_id: id,
        author_id: uid,
        body: clean,
        is_internal: false,
      });

      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("requests")
        .update({ last_updated: new Date().toISOString() })
        .eq("id", id);

      if (updErr) throw updErr;

      const { data: m } = await supabase
        .from("request_messages")
        .select("id, created_at, request_id, author_id, body, is_internal")
        .eq("request_id", id)
        .order("created_at", { ascending: true });

      setMsgs((((m ?? []) as MsgRow[]) || []).filter((x) => !x.is_internal));
      setReply("");
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

  if (!req) return null;

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/members/inbox" className="text-sm text-white/70 hover:text-white">
          ← Back to Inbox
        </Link>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{req.subject || "(no subject)"}</h1>
        <div className="mt-2 text-sm text-white/60">
          Category: {req.category || "other"} • Status: {req.status || "open"}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/60 mb-2">Your original request</div>
          <pre className="whitespace-pre-wrap text-sm text-white/85">{req.body || ""}</pre>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 text-xs text-white/60 bg-white/5">Thread</div>

          <div className="px-4 py-4 space-y-4">
            {msgs.length === 0 ? (
              <div className="text-sm text-white/60">No replies yet.</div>
            ) : (
              msgs.map((m) => (
                <div key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/50">{new Date(m.created_at).toLocaleString()}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{m.body}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">Reply</div>
          <textarea
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm outline-none"
            rows={5}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
          />
          {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}
          <div className="mt-3 flex gap-2">
            <button
              onClick={sendReply}
              disabled={saving}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm"
            >
              {saving ? "Sending…" : "Send reply"}
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
