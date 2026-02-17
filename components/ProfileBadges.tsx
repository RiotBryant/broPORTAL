"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type BadgeRow = {
  badges: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
  } | null;
};

export default function ProfileBadges({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BadgeRow[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("badge_awards")
        .select("badges:badge_id(id,name,slug,icon,description)")
        .eq("user_id", userId)
        .is("revoked_at", null);

      if (!alive) return;

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as BadgeRow[]);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  const badgeList = items.map((x) => x.badges).filter(Boolean) as NonNullable<BadgeRow["badges"]>[];

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="text-lg font-semibold">Badges</div>
      <div className="tiny">Earned + awarded.</div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {loading ? (
          <div className="chip">Loading…</div>
        ) : badgeList.length === 0 ? (
          <div className="chip">No badges yet</div>
        ) : (
          badgeList.map((b) => (
            <div key={b.id} className="chip">
              <b>{b.icon ? `${b.icon} ` : ""}{b.name}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
