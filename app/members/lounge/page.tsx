"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getMyRole, isAdminRole } from "@/lib/store";
import type { Role } from "@/lib/store";

type RoomRow = {
  id: string;
  name: string;
  provider: "meet" | "jaas8x8";
  url: string;
  min_role: Role;
  logo_url: string | null;
};

const ROLE_RANK: Record<Role, number> = {
  member: 0,
  admin: 1,
  superadmin: 2,
};

function canSee(userRole: Role, minRole: Role) {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export default function LoungePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("member");
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const isAdmin = useMemo(() => isAdminRole(role), [role]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.replace(`/login?next=${encodeURIComponent("/members/lounge")}`);
        return;
      }

      const r: Role = await getMyRole().catch(() => "member" as Role);
      setRole(r);

      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,provider,url,min_role,logo_url")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setRooms([]);
      } else {
        const all = (data ?? []) as RoomRow[];
        setRooms(all.filter((rm) => canSee(r, rm.min_role)));
      }

      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <div className="opacity-70 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">broT Lounge</div>
            <div className="text-sm text-white/60">
              Choose a room. Min role enforced. Your role: <b>{role}</b>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/members" className="pill">← Back</Link>
            {isAdmin ? <Link href="/members/admin/events" className="pill pillPrimary">Admin Events</Link> : null}
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="grid gap-3 sm:grid-cols-2">
          {rooms.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="card hover:opacity-95 transition"
            >
              <div className="text-base font-semibold">{r.name}</div>
              <div className="text-sm text-white/65 mt-1">
                provider: {r.provider} • min role: {r.min_role}
              </div>
              <div className="mt-4">
                <span className="pill pillPrimary">Enter</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .pill {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          height: 42px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .12s ease, border-color .12s ease, background .12s ease;
        }
        .pill:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); }
        .pillPrimary { background:#fff; color:#000; border:none; }
        .card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 18px;
          text-decoration: none;
          color: white;
        }
      `}</style>
    </div>
  );
}
