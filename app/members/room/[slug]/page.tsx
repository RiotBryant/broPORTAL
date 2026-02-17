
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getMyRole } from "@/lib/store";
import { ROOMS, type RoomSlug } from "@/lib/rooms";

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

// Converts a room URL into a safe embed URL
function toEmbedUrl(room: RoomRow) {
  const raw = (room.url || "").trim();

  // Default: if it's already an embed link, keep it
  if (raw.includes("/iframe")) return raw;

  // meet.jit.si -> /<roomName>#config.prejoinPageEnabled=false
  if (room.provider === "meet") {
    // raw could be https://meet.jit.si/RoomName
    // embed endpoint: https://meet.jit.si/RoomName#config.prejoinPageEnabled=false
    const u = new URL(raw);
    const roomPath = u.pathname; // "/RoomName"
    return `https://meet.jit.si${roomPath}#config.prejoinPageEnabled=false`;
  }

  // 8x8.vc / JaaS: many links are already embeddable as-is in an iframe
  // If you ever use a special embed endpoint, you can tweak here.
  return raw;
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roomId = params?.id;

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("member");
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [err, setErr] = useState<string>("");

  const embedUrl = useMemo(() => (room ? toEmbedUrl(room) : ""), [room]);

  useEffect(() => {
    (async () => {
      setErr("");

      // Auth gate
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.replace(`/login?next=${encodeURIComponent(`/members/room/${roomId}`)}`);
        return;
      }

      const r: Role = await getMyRole().catch(() => "member" as Role);
      setRole(r);

      // Load room by UUID
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,provider,url,min_role,logo_url")
        .eq("id", roomId)
        .single();

      if (error || !data) {
        console.error(error);
        setErr("Room not found.");
        setRoom(null);
        setLoading(false);
        return;
      }

      const row = data as RoomRow;

      // Role gate
      if (!canSee(r, row.min_role)) {
        setErr("You don’t have access to this room.");
        setRoom(null);
        setLoading(false);
        return;
      }

      setRoom(row);
      setLoading(false);
    })();
  }, [router, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <div className="opacity-70 text-sm">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
          <div className="flex items-center justify-between gap-3">
            <Link href="/members/lounge" className="pill">← Back to Lounge</Link>
            <div className="text-sm text-white/60">role: <b>{role}</b></div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="text-lg font-semibold">Can’t open room</div>
            <div className="text-sm text-white/65" style={{ marginTop: 8 }}>{err}</div>
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
          }
          .card {
            background: rgba(255,255,255,0.035);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 24px;
            padding: 18px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{room?.name}</div>
            <div className="text-sm text-white/60">
              provider: <b>{room?.provider}</b> • min role: <b>{room?.min_role}</b>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/members/lounge" className="pill">← Lounge</Link>
            <a className="pill pillPrimary" href={room?.url || "#"} target="_blank" rel="noreferrer">
              Open direct
            </a>
          </div>
        </div>

        <div className="frameWrap" style={{ marginTop: 14 }}>
          <iframe
            title={room?.name || "Room"}
            src={embedUrl}
            className="frame"
            allow="camera; microphone; fullscreen; display-capture"
          />
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
          text-decoration: none;
          color: white;
          font-size: 14px;
        }
        .pill:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); }
        .pillPrimary { background: #fff; color:#000; border:none; }
        .frameWrap {
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          height: calc(100vh - 130px);
          min-height: 560px;
        }
        .frame {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
      `}</style>
    </div>
  );
}
