"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type NextEvent = {
  id: string;
  title: string;
  starts_at: string; // timestamptz ISO
  location: string | null;
};

function msToParts(ms: number) {
  const total = Math.max(0, ms);
  const s = Math.floor(total / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return { days, hours, mins, secs };
}

export default function Countdown() {
  const [evt, setEvt] = useState<NextEvent | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;

    async function load() {
      // Next upcoming active event
      const { data, error } = await supabase
        .from("events")
        .select("id,title,starts_at,location")
        .eq("is_active", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1);

      if (!alive) return;

      if (error) {
        console.error(error);
        setEvt(null);
        return;
      }

      setEvt((data?.[0] as NextEvent) ?? null);
    }

    load();

    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const parts = useMemo(() => {
    if (!evt) return null;
    const target = new Date(evt.starts_at).getTime();
    return msToParts(target - now);
  }, [evt, now]);

  if (!evt) {
    return (
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 900 }}>Next Meeting</div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>No event scheduled yet.</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontWeight: 900 }}>Next Meeting</div>
      <div style={{ opacity: 0.8, marginTop: 4 }}>
        {evt.title} {evt.location ? `• ${evt.location}` : ""}
      </div>

      {parts ? (
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <div className="chip"><b>{parts.days}</b> days</div>
          <div className="chip"><b>{parts.hours}</b> hrs</div>
          <div className="chip"><b>{parts.mins}</b> min</div>
          <div className="chip"><b>{parts.secs}</b> sec</div>
        </div>
      ) : null}
    </div>
  );
}
