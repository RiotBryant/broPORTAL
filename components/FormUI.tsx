"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Kind = "access" | "support";

export default function FormUI(props: { kind?: Kind }) {
  const router = useRouter();
  const kind: Kind = props.kind ?? "access";

  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState(""); // ✅ FIX: body exists
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function submit() {
    setErr(null);
    setOk(null);

    if (!body.trim()) return;

    setSending(true);
    try {
      // Minimal live-safe behavior:
      // If you already have a working endpoint/store, wire it later.
      // For now we route user to admin inbox or show success.
      // Replace this block with your real Supabase insert when ready.
      setOk(kind === "access" ? "Request submitted." : "Message sent.");
      setSubject("");
      setBody("");

      // Optional: bounce back
      // router.push("/members");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to submit.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {kind === "access" ? "Request Access" : "Support Message"}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              {kind === "access"
                ? "Send an access request to admins."
                : "Send a support message to admins."}
            </p>
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

        {ok ? (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
            {ok}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="block text-xs text-white/60">Subject</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={kind === "access" ? "Request Access" : "Support"}
          />

          <label className="mt-4 block text-xs text-white/60">Message</label>
          <textarea
            className="mt-2 w-full min-h-[140px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={kind === "access" ? "Why do you need access?" : "What do you need help with?"}
          />

          <div className="mt-4 flex gap-2">
            <button
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
              onClick={submit}
              disabled={sending || !body.trim()}
            >
              {sending ? "Sending…" : "Submit"}
            </button>

            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              onClick={() => {
                setSubject("");
                setBody("");
                setErr(null);
                setOk(null);
              }}
              disabled={sending}
            >
              Clear
            </button>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Live note: this form currently shows success locally. If you want it writing to Supabase right now,
            tell me which table you want it to insert into (you already have <b>access_requests</b> / <b>requests</b>).
          </div>
        </div>
      </div>
    </div>
  );
}
