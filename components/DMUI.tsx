"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { store } from "@/lib/store";
import { mockMe, mockDirectory } from "@/lib/mock";

export default function DMUI({ threadId }: { threadId?: string }) {
  const me = mockMe();
  const directory = useMemo(() => mockDirectory(), []);
  const [text, setText] = useState("");

  const [threads, setThreads] = useState(store.dm.listThreads());
  const [active, setActive] = useState(threadId || threads[0]?.id || "");
  const [items, setItems] = useState(active ? store.dm.list(active) : []);

  useEffect(() => store.dm.subscribe(() => {
    setThreads(store.dm.listThreads());
    if (active) setItems(store.dm.list(active));
  }), [active]);

  useEffect(() => {
    if (threadId) setActive(threadId);
  }, [threadId]);

  useEffect(() => {
    if (active) setItems(store.dm.list(active));
  }, [active]);

  function startThread(withName: string) {
    const id = store.dm.startThread(withName);
    setActive(id);
  }

  function send() {
    if (!active || !text.trim()) return;
    store.dm.send(active, { from: me.displayName, body: text.trim() });
    setText("");
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 2fr" }}>
      <div className="card">
        <div className="cardTitle">Threads</div>
        <div className="cardDesc">Mock DMs. Later: real DMs via Supabase.</div>

        <div style={{ marginTop: 10 }}>
          {threads.map((t) => (
            <Link key={t.id} className="pill" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
              href={`/members/dm/${t.id}`}>
              <span>{t.with}</span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>{t.count}</span>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="tiny">Start new DM</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {directory.filter((x) => x !== me.displayName).slice(0, 6).map((name) => (
              <button key={name} className="btn btnGhost" onClick={() => startThread(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">{active ? `DM: ${store.dm.threadLabel(active)}` : "Select a thread"}</div>

        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {items.map((m) => (
            <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)" }}>
                <b style={{ color: "rgba(255,255,255,0.9)" }}>{m.from}</b> • {new Date(m.ts).toLocaleString()}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.80)" }}>{m.body}</div>
            </div>
          ))}
        </div>

        <div className="cardActions">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a DM…" />
          <button className="btn btnPrimary" onClick={send} disabled={!active}>Send</button>
          <Link className="btn btnGhost" href="/members/chat">Group Chat</Link>
        </div>
      </div>
    </div>
  );
}
