"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordFromEmailLink() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    // If the user arrived from a Supabase recovery link, a session gets established.
    // We just verify that a session exists so updateUser can work.
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setErr("This reset link is invalid or expired. Use Forgot Password again.");
        return;
      }
      setReady(true);
    })();
  }, []);

  async function setPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Password updated. Redirecting...");
    setTimeout(() => router.replace("/login"), 700);
  }

  const css = `
    :root{color-scheme:dark;}
    .page{min-height:100vh;background:#07070b;color:white;display:grid;place-items:center;padding:24px;}
    .card{width:100%;max-width:460px;border-radius:24px;padding:28px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);}
    h1{margin:0 0 6px;font-size:22px;font-weight:800;}
    p{margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.55);}
    .input{width:100%;padding:12px 14px;margin-bottom:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:white;}
    .btn{width:100%;border-radius:999px;padding:12px 14px;font-size:14px;font-weight:800;border:none;cursor:pointer;background:#ffffff;color:#000;}
    .ok{margin:0 0 12px;font-size:13px;color:rgba(170,255,200,0.9);}
    .err{margin:0 0 12px;font-size:13px;color:#ff6b6b;}
  `;

  return (
    <div className="page">
      <style>{css}</style>
      <div className="card">
        <h1>Set new password</h1>
        <p>Finish your reset.</p>

        {ok && <div className="ok">{ok}</div>}
        {err && <div className="err">{err}</div>}

        {ready && (
          <form onSubmit={setPassword}>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required />
            <button className="btn" disabled={loading}>{loading ? "Saving..." : "Save password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
