"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Category = "resources" | "legal" | "medical" | "other";

export default function SupportFormPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("member");

  const [category, setCategory] = useState<Category>("resources");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isAdmin = useMemo(
    () => role === "admin" || role === "superadmin",
    [role]
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }

      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();

      setRole(r?.role ?? "member");
      setLoading(false);
    })();
  }, [router]);

  async function submit() {
    setErr(null);
    setOk(null);

    const cleanSubject = subject.trim();
    const cleanBody = body.trim();
    const cleanUrgent = urgent.trim();

    if (!cleanSubject || !cleanBody) {
      setErr("Subject + message are required.");
      return;
    }

    const fullBody =
      `Message:\n${cleanBody}\n\n` +
      `Urgent?:\n${cleanUrgent || "No answer provided."}`;

    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }

      const { data: req, error: reqErr } = await supabase
        .from("requests")
        .insert({
          created_by: uid,
          category,
          subject: cleanSubject,
          status: "open",
          visibility: "admin",
          body: fullBody,
        })
        .select("id")
        .single();

      if (reqErr) throw reqErr;

      const { error: msgErr } = await supabase.from("request_messages").insert({
        request_id: req.id,
        author_id: uid,
        body: fullBody,
        is_internal: false,
      });

      if (msgErr) throw msgErr;

      setOk("Sent. An admin will see this in the inbox.");
      setSubject("");
      setBody("");
      setUrgent("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send.");
    } finally {
      setSubmitting(false);
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
      <style>{`
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 60px rgba(80,170,255,0.06);
        }
        .btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          transition: transform .12s ease, border-color .12s ease, background .12s ease;
        }
        .btn:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); }
        .btnPrimary { background: #ffffff; color: #000000; border: none; }
        .input {
          width: 100%;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          padding: 10px 12px;
          outline: none;
        }
        .input:focus {
          border-color: rgba(90,170,255,0.35);
          box-shadow: 0 0 0 3px rgba(90,170,255,0.12);
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Request Support</h1>
            <p className="mt-2 text-sm text-white/70">
              Built on presence, not noise. This goes to the admin inbox.
            </p>
          </div>

          <div className="text-right">
            {isAdmin ? (
              <Link
                href="/members/admin/inbox"
                className="text-xs text-white/70 hover:text-white"
              >
                Admin Inbox →
              </Link>
            ) : null}

            <div className="mt-2">
              <Link href="/members" className="h-9 rounded-xl px-3 text-sm btn inline-grid place-items-center">
                Back
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 glass rounded-2xl p-6">
          <label className="text-xs text-white/60">Category</label>
          <select
            className="input mt-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="resources">Resources</option>
            <option value="legal">Legal</option>
            <option value="medical">Medical</option>
            <option value="other">Other</option>
          </select>

          <div className="mt-4">
            <label className="text-xs text-white/60">Subject</label>
            <input
              className="input mt-2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short title (what’s going on?)"
              maxLength={120}
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-white/60">Message</label>
            <textarea
              className="input mt-2"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write what you need. Calm + clear."
              rows={6}
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-white/60">Is this urgent?</label>
            <input
              className="input mt-2"
              value={urgent}
              onChange={(e) => setUrgent(e.target.value)}
              placeholder="If yes, say why / timeframe. If not, say ‘no’."
              maxLength={140}
            />
          </div>

          {err ? <div className="mt-4 text-sm text-red-300">{err}</div> : null}
          {ok ? <div className="mt-4 text-sm text-emerald-200">{ok}</div> : null}

          <div className="mt-6 flex gap-2">
            <button
              onClick={submit}
              disabled={submitting}
              className="h-11 rounded-xl px-4 text-sm btnPrimary"
            >
              {submitting ? "Sending…" : "Send to Admin Inbox"}
            </button>

            <Link href="/members" className="h-11 rounded-xl px-4 grid place-items-center text-sm btn">
              Cancel
            </Link>
          </div>
        </div>

        <div className="mt-6 text-xs text-white/45">
          Nothing auto-joins. Nothing is recorded here. Quiet by design.
        </div>
      </div>
    </div>
  );
}
