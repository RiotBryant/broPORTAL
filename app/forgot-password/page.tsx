"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Mode = "email" | "security" | "admin";

export default function ForgotPasswordHub() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("email");

  // shared
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // security-question flow
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"start" | "question" | "set">("start");

  async function sendEmailReset(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) return setErr(error.message);
    setOk("Check your email for a reset link.");
  }

  async function securityGetQuestion(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const res = await fetch("/api/security-reset/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setErr(data?.error || "Could not find that account.");

    setQuestion(data.question);
    setStep("question");
  }

  async function securityVerify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const res = await fetch("/api/security-reset/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, answer }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setErr(data?.error || "Wrong answer.");

    setStep("set");
  }

  async function securitySet(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const res = await fetch("/api/security-reset/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setErr(data?.error || "Could not reset password.");

    setOk("Password updated. Go log in.");
  }

  async function requestAdminHelp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const res = await fetch("/api/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setErr(data?.error || "Could not submit request.");

    setOk("Request sent to admins. You’ll get help soon.");
  }

  const css = `
    :root{color-scheme:dark;}
    .page{min-height:100vh;background:#07070b;color:white;display:grid;place-items:center;padding:24px;}
    .card{width:100%;max-width:560px;border-radius:24px;padding:28px;
      background: radial-gradient(900px 420px at 20% 35%, rgba(80,170,255,0.16), transparent),
                  rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.10);
      box-shadow:0 0 60px rgba(80,170,255,0.06);
    }
    h1{margin:0 0 6px;font-size:22px;font-weight:800;letter-spacing:-0.02em;}
    p{margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.55);}
    .tabs{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 18px;}
    .tab{border-radius:999px;padding:10px 14px;font-size:13px;cursor:pointer;
      border:1px solid rgba(255,255,255,0.12);
      background:rgba(255,255,255,0.06);
      color:rgba(255,255,255,0.9);
    }
    .tabActive{background:#ffffff;color:#000;border:none;}
    .input{width:100%;padding:12px 14px;margin-bottom:12px;border-radius:12px;
      border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:white;}
    .btn{width:100%;border-radius:999px;padding:12px 14px;font-size:14px;font-weight:800;border:none;cursor:pointer;
      background:#ffffff;color:#000;transition:transform .12s ease,opacity .12s ease;}
    .btn:hover{transform:translateY(-1px);opacity:.95;}
    .ghost{margin-top:10px;background:rgba(255,255,255,0.08);color:white;border:1px solid rgba(255,255,255,0.15);}
    .msgOk{margin:0 0 12px;font-size:13px;color:rgba(170,255,200,0.9);}
    .msgErr{margin:0 0 12px;font-size:13px;color:#ff6b6b;}
    .label{font-size:12px;color:rgba(255,255,255,0.60);margin:6px 0 10px;}
  `;

  return (
    <div className="page">
      <style>{css}</style>

      <div className="card">
        <h1>Reset your password</h1>
        <p>Pick the simplest option for you.</p>

        <div className="tabs">
          <button className={`tab ${mode === "email" ? "tabActive" : ""}`} onClick={() => (setMode("email"), setErr(null), setOk(null))}>
            Email link
          </button>
          <button className={`tab ${mode === "security" ? "tabActive" : ""}`} onClick={() => (setMode("security"), setErr(null), setOk(null), setStep("start"))}>
            Security question
          </button>
          <button className={`tab ${mode === "admin" ? "tabActive" : ""}`} onClick={() => (setMode("admin"), setErr(null), setOk(null))}>
            Ask admin
          </button>
        </div>

        {ok && <div className="msgOk">{ok}</div>}
        {err && <div className="msgErr">{err}</div>}

        {mode === "email" && (
          <form onSubmit={sendEmailReset}>
            <div className="label">Email</div>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</button>
          </form>
        )}

        {mode === "security" && (
          <>
            {step === "start" && (
              <form onSubmit={securityGetQuestion}>
                <div className="label">Email</div>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button className="btn" disabled={loading}>{loading ? "Loading..." : "Continue"}</button>
              </form>
            )}

            {step === "question" && (
              <form onSubmit={securityVerify}>
                <div className="label">Security question</div>
                <div style={{ marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>{question}</div>
                <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" required />
                <button className="btn" disabled={loading}>{loading ? "Verifying..." : "Verify answer"}</button>
              </form>
            )}

            {step === "set" && (
              <form onSubmit={securitySet}>
                <div className="label">New password</div>
                <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <button className="btn" disabled={loading}>{loading ? "Resetting..." : "Set new password"}</button>
              </form>
            )}
          </>
        )}

        {mode === "admin" && (
          <form onSubmit={requestAdminHelp}>
            <div className="label">Email</div>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn" disabled={loading}>{loading ? "Sending..." : "Send request to Admin Inbox"}</button>
            <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              This creates a ticket in Admin Inbox so you get help even if email/security fails.
            </div>
          </form>
        )}

        <button className="btn ghost" onClick={() => router.push("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
