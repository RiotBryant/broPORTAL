"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type Award = {
  id: string;
  badge_id: string;
  user_id: string;
  created_at: string;
  revoked_at: string | null;
};

export default function ProfileBadges({ userId }: { userId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [badges, setBadges] = React.useState<Badge[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr(null);
        setLoading(true);

        // 1) get active awards for this user
        const { data: awards, error: aErr } = await supabase
          .from("badge_awards")
          .select("id,badge_id,user_id,created_at,revoked_at")
          .eq("user_id", userId)
          .is("revoked_at", null)
          .order("created_at", { ascending: false });

        if (aErr) throw new Error(aErr.message);

        const badgeIds = Array.from(new Set((awards ?? []).map((a: Award) => a.badge_id)));
        if (!badgeIds.length) {
          if (!alive) return;
          setBadges([]);
          setLoading(false);
          return;
        }

        // 2) fetch badge definitions
        const { data: defs, error: bErr } = await supabase
          .from("badges")
          .select("id,name,description,icon")
          .in("id", badgeIds);

        if (bErr) throw new Error(bErr.message);

        if (!alive) return;

        // Keep ordering similar to awards order
        const defById = new Map<string, Badge>();
        (defs ?? []).forEach((b: Badge) => defById.set(b.id, b));

        const ordered: Badge[] = [];
        for (const id of badgeIds) {
          const b = defById.get(id);
          if (b) ordered.push(b);
        }

        setBadges(ordered);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load badges.");
        setBadges([]);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  if (loading) {
    return <div className="text-sm text-white/60">Loading badges…</div>;
  }

  if (err) {
    return (
      <div className="text-sm rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">
        {err}
      </div>
    );
  }

  if (!badges.length) {
    return <div className="text-sm text-white/60">No badges yet.</div>;
  }

  return (
    <div className="grid gap-2">
      {badges.map((b) => (
        <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">{b.name}</div>
            {b.icon ? <div className="text-lg">{b.icon}</div> : null}
          </div>
          {b.description ? <div className="mt-1 text-xs text-white/60">{b.description}</div> : null}
        </div>
      ))}
    </div>
  );
}
