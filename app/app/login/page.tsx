"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/members");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    setRedirectTo(url.searchParams.get("redirect") || "/members");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        padding: 18,
        background: "rgba(255,255,255,0.05)"
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Log in</h1>
        <p style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
          Continue to the broT portal.
        </p>

        {msg && (
          <div style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,80,80,0.35)",
            background: "rgba(255,80,80,0.08)",
            fontSize: 13
          }}>
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.35)",
                color: "white"
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.35)",
                color: "white"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "10px 12px",
              borderRadius: 999,
              border: "none",
              background: "white",
              color: "black",
              fontWeight: 800,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
