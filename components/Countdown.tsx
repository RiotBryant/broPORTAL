"use client";

import { useEffect, useMemo, useState } from "react";
import { NextEvent } from "@/lib/store";

export default function Countdown() {
  const evt = useMemo(() => NextEvent(), []);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, evt.when - now);
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    <div className="chipRow">
      <div className="chip">
        Next: <b>{evt.title}</b>
      </div>
      <div className="chip">
        Countdown: <b>{d}d {h}h {m}m {sec}s</b>
      </div>
    </div>
  );
}
