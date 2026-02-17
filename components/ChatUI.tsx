"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChatUI() {
  const me = { id: "me", name: "You" };
  const [text, setText] = useState("");
  const [items, setItems] = useState(store.group.list());

  useEffect(() => {
    return store.group.subscribe(() => setItems(store.group.list()));
  }, []);

  function send() {
    if (!text.trim()) return;
    store.group.send({ from: me.displayName, body: text.trim() });
    setText("");
  }

  return (
    <div className="card">
      <div className="cardDesc">This is a working mock chat. Later, we swap store → Supabase realtime.</div>

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
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <button className="btn btnPrimary" onClick={send}>Send</button>
        <Link className="btn btnGhost" href="/members/inbox">DM Inbox</Link>
      </div>
    </div>
  );
}
