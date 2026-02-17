"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If there is no session, this page can't work.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?error=no_session_for_reset");
      }
    });
  }, [router, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (pw1.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setMsg("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.replace("/portal");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-white/70">
            This link is for members only. Choose a strong password.
          </p>
        </div>

        {msg && (
          <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 p-3"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 p-3"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-white text-black font-semibold p-3 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save password"}
          </button>
        </form>
      </div>
    </main>
  );
}
