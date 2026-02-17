"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/members");
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
      background: radial-gradient(
        900px 400px at 50% 0%,
        rgba(80,170,255,0.15),
        transparent
      ),
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
      font-weight: 600;
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

    .btn:hover {
      transform: translateY(-1px);
      opacity: 0.95;
    }

    .error {
      margin-bottom: 12px;
      font-size: 13px;
      color: #ff6b6b;
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
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn btnPrimary"
            disabled={loading}
          >
            {loading ? "Entering..." : "Enter Portal"}
          </button>
        </form>

        <button
          className="btn btnSecondary"
          onClick={() => router.push("/members/request-access")}
        >
          Request Access
        </button>
      </div>
    </div>
  );
}
