"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getMyRole } from "@/lib/store";

type Badge = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
};

type AwardRow = {
  badge_id: Badge | null;
};

export default function ProfileBadges({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("badge_awards")
        .select("badge_id(id,name,slug,icon,description)")
        .eq("user_id", userId)
        .is("revoked_at", null);

      if (!alive) return;

      if (error) {
        console.error(error);
        setBadges([]);
      } else {
        const rows = (data ?? []) as AwardRow[];
        const list = rows.map((r) => r.badge_id).filter(Boolean) as Badge[];
        setBadges(list);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="text-lg font-semibold">Badges</div>
      <div className="tiny">Earned + awarded.</div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {loading ? (
          <div className="chip">Loading…</div>
        ) : badges.length === 0 ? (
          <div className="chip">No badges yet</div>
        ) : (
          badges.map((b) => (
            <div key={b.id} className="chip">
              <b>{b.icon ? `${b.icon} ` : ""}{b.name}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
