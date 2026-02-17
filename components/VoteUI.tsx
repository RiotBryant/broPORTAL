"use client";

import { useState } from "react";
import { mockPoll } from "@/lib/mock";
import { getMyRole } from "@/lib/store";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/store";

export default function VoteUI() {
  const poll = mockPoll();
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="card">
      <div className="cardTitle">{poll.question}</div>
      <div className="cardDesc">Voting skeleton. Later: store to DB.</div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {poll.options.map((o) => (
          <button
            key={o}
            className={`btn ${picked === o ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setPicked(o)}
          >
            {o}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }} className="tiny">
        Selected: <b style={{ color: "rgba(255,255,255,0.85)" }}>{picked || "none"}</b>
      </div>
    </div>
  );
}
