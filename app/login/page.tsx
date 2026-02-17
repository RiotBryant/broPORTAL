"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/members");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    setRedirectTo(url.searchParams.get("redirect") || "/members");
  }, []);

  function setGateCookie() {
    // Set a simple cookie recognized by middleware
    document.cookie = `brot_gate=1; Path=/; SameSite=Lax`;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (pass !== APP.SHARED_PASSWORD) {
      setMsg("Wrong password.");
      return;
    }

    setGateCookie();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{
        width: "100%",
        maxWidth: 520,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 22,
        background: "rgba(255,255,255,0.05)",
        padding: 18
      }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>broT Portal</div>
        <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          Members-only gate (skeleton mode). Later we switch to Supabase accounts.
        </div>

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

        <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Portal Password</div>
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              type="password"
              placeholder="Enter password"
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
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              border: "none",
              background: "white",
              color: "black",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            Enter Portal
          </button>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Redirect target: <span style={{ color: "rgba(255,255,255,0.85)" }}>{redirectTo}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
