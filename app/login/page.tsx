"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/members";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Let middleware handle protection; we just send them where they intended to go
    router.replace(redirectTo);
  }

  const styles = `
    :root { color-scheme: dark; }
    .page {
      min-height: 100vh;
      background: #07070b;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      padding: 32px;
      background:
        radial-gradient(900px 400px at 50% 0%, rgba(80,170,255,0.15), transparent),
        rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 0 60px rgba(80,170,255,0.06);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0 0 24px;
      font-size: 13px;
      color: rgba(255,255,255,0.55);
    }
    .input {
      width: 100%;
      padding: 12px 14px;
      margin-bottom: 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: white;
      font-size: 14px;
      outline: none;
    }
    .input:focus {
      border-color: rgba(80,170,255,0.6);
      box-shadow: 0 0 0 1px rgba(80,170,255,0.6);
    }
    .btn {
      width: 100%;
      padding: 12px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: transform .12s ease, opacity .12s ease;
    }
    .btnPrimary {
      background: white;
      color: black;
      margin-bottom: 12px;
    }
    .btnSecondary {
      background: rgba(255,255,255,0.08);
      color: white;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .btn:hover { transform: translateY(-1px); opacity: 0.95; }
    .btnRow { display: grid; gap: 10px; margin-top: 10px; }
    .error {
      margin-bottom: 12px;
      font-size: 13px;
      color: #ff6b6b;
    }
    .hint {
      margin-top: 14px;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
      line-height: 1.4;
    }
  `;

  return (
    <div className="page">
      <style>{styles}</style>

      <div className="card">
        <h1>broPORTAL</h1>
        <p>Quiet by design • presence over performance</p>

        <form onSubmit={handleLogin}>
          {error && <div className="error">{error}</div>}

          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" className="btn btnPrimary" disabled={loading}>
            {loading ? "Entering..." : "Enter Portal"}
          </button>
        </form>

        <div className="btnRow">
          <button
            type="button"
            className="btn btnSecondary"
            onClick={() => router.push("/members/reset-password")}
          >
            Forgot password
          </button>

          <button
            type="button"
            className="btn btnSecondary"
            onClick={() => router.push("/members/request-access")}
          >
            Request Access
          </button>
        </div>

        <div className="hint">
          If you were sent here automatically, logging in will return you to the page you tried to open.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Fixes Next build error: useSearchParams must be inside Suspense
  return (
    <React.Suspense fallback={null}>
      <LoginInner />
    </React.Suspense>
  );
}
