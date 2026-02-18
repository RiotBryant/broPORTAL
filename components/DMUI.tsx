"use client";

import * as React from "react";
import Link from "next/link";

type Thread = { id: string; with: string; count: number };
type Msg = { id: string; from: string; ts: number; body: string };

export default function DMUI() {
  const me = { displayName: "Me" };

  const directory = ["Melly", "Mirim", "Elijah", "Levi", "Dana", "Me"];
  const threads: Thread[] = [
    { id: "t1", with: "Melly", count: 3 },
    { id: "t2", with: "Mirim", count: 1 },
  ];

  const [active, setActive] = React.useState<string | null>(threads[0]?.id ?? null);
  const [text, setText] = React.useState("");

  const items: Msg[] = React.useMemo(() => {
    if (!active) return [];
    return [
      { id: "m1", from: "Melly", ts: Date.now() - 60_000, body: "Yo" },
      { id: "m2", from: me.displayName, ts: Date.now() - 30_000, body: "What’s good" },
    ];
  }, [active]);

  function startThread(name: string) {
    // For now just fake select
    setActive("new");
    setText(`Hey ${name} — `);
  }

  function send() {
    if (!active) return;
    if (!text.trim()) return;
    setText("");
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 12 }}>
      {/* LEFT */}
      <div className="card">
        <div className="cardTitle">Threads</div>
        <div className="cardDesc">Mock DMs. Later: real DMs via Supabase.</div>

        <div style={{ marginTop: 10 }}>
          {threads.map((t) => (
            <button
              key={t.id}
              className="pill"
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                marginBottom: 8,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 999,
                padding: "10px 12px",
                color: "white",
                cursor: "pointer",
              }}
              onClick={() => setActive(t.id)}
            >
              <span>{t.with}</span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>{t.count}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="tiny">Start new DM</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {directory
              .filter((x) => x !== me.displayName)
              .slice(0, 6)
              .map((name) => (
                <button key={name} className="btn btnGhost" onClick={() => startThread(name)}>
                  {name}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="card">
        <div className="cardTitle">{active ? "DM" : "Select a thread"}</div>

        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {items.map((m) => (
            <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)" }}>
                <b style={{ color: "rgba(255,255,255,0.9)" }}>{m.from}</b> •{" "}
                {new Date(m.ts).toLocaleString()}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.80)" }}>
                {m.body}
              </div>
            </div>
          ))}
        </div>

        <div className="cardActions">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a DM…" />
          <button className="btn btnPrimary" onClick={send} disabled={!active}>
            Send
          </button>
          <Link className="btn btnGhost" href="/members/chat">
            Group Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
