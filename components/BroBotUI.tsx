"use client";

import { useState } from "react";
import { brobotAnswer } from "@/lib/mock";
import Link from "next/link";

export default function BroBotUI() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);

  function ask() {
    if (!q.trim()) return;
    setA(brobotAnswer(q.trim()));
  }

  return (
    <div className="card">
      <div className="cardDesc">
        broBOT skeleton. Later: connect to your real docs + optional AI.
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="tiny">Ask broBOT</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you need help with?" />
      </div>

      <div className="cardActions">
        <button className="btn btnPrimary" onClick={ask}>Ask</button>
        <Link className="btn btnGhost" href="/members/forms">Route a request</Link>
      </div>

      {a ? (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
          <div className="chip"><b>broBOT:</b> {a}</div>
        </div>
      ) : null}
    </div>
  );
}
