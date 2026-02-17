"use client";

import { useState } from "react";
import Link from "next/link";

export default function BroBotUI() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ask() {
    const question = q.trim();
    if (!question) return;

    setLoading(true);
    setErr(null);
    setA(null);

    try {
      // Placeholder: you can wire this to a real API later.
      // For now: keep it build-safe and functional.
      await new Promise((r) => setTimeout(r, 400));
      setA(
        "broBOT is online (skeleton mode). For now I can route you: Support → Admin Inbox, or Lounge Rooms → Jitsi."
      );
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page as any}>
      <div style={styles.top as any}>
        <Link href="/members" style={styles.back as any}>
          ← Back
        </Link>
        <div style={styles.brand as any}>broBOT</div>
      </div>

      <div style={styles.card as any}>
        <div style={styles.h1 as any}>Signal broBOT</div>
        <div style={styles.p as any}>
          Grounding • guidance • routing (skeleton mode)
        </div>

        <div style={styles.row as any}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask broBOT…"
            style={styles.input as any}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
          />
          <button
            onClick={ask}
            disabled={loading}
            style={{
              ...(styles.btn as any),
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "…" : "Ask"}
          </button>
        </div>

        {err && <div style={styles.err as any}>{err}</div>}
        {a && <div style={styles.answer as any}>{a}</div>}

        <div style={styles.quick as any}>
          <Link href="/members/support" style={styles.chip as any}>
            Support
          </Link>
          <Link href="/members/admin/inbox" style={styles.chip as any}>
            Admin Inbox
          </Link>
          <Link href="/members/lounge" style={styles.chip as any}>
            Lounge
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#07070b",
    color: "white",
    padding: "24px",
  },
  top: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  back: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.85)",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  },
  brand: {
    fontWeight: 900,
    letterSpacing: "-0.02em",
    fontSize: "18px",
  },
  card: {
    maxWidth: "820px",
    borderRadius: "24px",
    padding: "22px",
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "radial-gradient(900px 420px at 50% 0%, rgba(80,170,255,0.14), transparent), rgba(255,255,255,0.04)",
    boxShadow: "0 0 60px rgba(80,170,255,0.06)",
  },
  h1: { fontSize: "28px", fontWeight: 900, marginBottom: "6px" },
  p: { fontSize: "13px", opacity: 0.6, marginBottom: "14px" },
  row: { display: "flex", gap: "10px", alignItems: "center" },
  input: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    outline: "none",
    fontSize: "14px",
  },
  btn: {
    padding: "12px 16px",
    borderRadius: "999px",
    border: "none",
    background: "white",
    color: "black",
    fontWeight: 800,
  },
  err: { marginTop: "12px", color: "#ff6b6b", fontSize: "13px" },
  answer: {
    marginTop: "12px",
    padding: "12px 14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    fontSize: "14px",
    lineHeight: 1.4,
  },
  quick: { display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" },
  chip: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.9)",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    fontSize: "13px",
  },
};
