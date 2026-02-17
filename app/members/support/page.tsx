"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type RoomDef = {
  slug: string;
  title: string;
  subtitle: string;
  jitsi: string;
  adminOnly?: boolean;
};

const ROOMS: RoomDef[] = [
  { slug: "weekly", title: "broT Meeting", subtitle: "Primary room • steady cadence", jitsi: "https://meet.jit.si/broTMeeting" },
  { slug: "chill-1", title: "Chill Room 1", subtitle: "Low pressure • drop in", jitsi: "https://meet.jit.si/ChillRoom1" },
  { slug: "chill-2", title: "Chill Room 2", subtitle: "Quiet talk • reset", jitsi: "https://meet.jit.si/ChillRoom2" },
  { slug: "admin", title: "Admin Only", subtitle: "Locked by trust", jitsi: "https://meet.jit.si/broTAdmin", adminOnly: true },
];

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("member");

  const room = useMemo(() => ROOMS.find((r) => r.slug === slug), [slug]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace(`/login?next=${encodeURIComponent(`/members/room/${slug || "weekly"}`)}`);
        return;
      }

      // pull role (needed for admin-only room)
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (uid) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
        setRole(r?.role ?? "member");
      }

      setLoading(false);
    })();
  }, [router, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <div className="opacity-70 text-sm">Loading…</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <div className="text-xl font-semibold">Room not found.</div>
          <div className="text-white/60 mt-2">That room slug doesn’t exist.</div>
          <div className="mt-6">
            <Link href="/members/lounge" className="underline">Back to Lounge</Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = role === "admin" || role === "superadmin";
  if (room.adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <div className="text-xl font-semibold">Locked by trust.</div>
          <div className="text-white/60 mt-2">This room is admin-only.</div>
          <div className="mt-6">
            <Link href="/members/lounge" className="underline">Back to Lounge</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        .wrap { width: min(1200px, calc(100% - 24px)); margin: 0 auto; padding: 18px 0 28px; }
        .glass {
          background:
            radial-gradient(900px 520px at 20% 10%, rgba(80,170,255,0.20), transparent 60%),
            radial-gradient(900px 520px at 80% 10%, rgba(255,80,210,0.14), transparent 60%),
            rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 70px rgba(0,0,0,0.45);
        }
        .btn {
          display:inline-flex; align-items:center; justify-content:center;
          height:42px; padding:0 14px; border-radius:999px;
          border:1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color:#fff; font-size:14px;
        }
        .btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
        .btnPrimary { background:#fff; color:#000; border:none; }
        .frame {
          width: 100%;
          height: calc(100vh - 160px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
        }
        iframe { width: 100%; height: 100%; border: 0; }
      `}</style>

      <div className="wrap">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{room.title}</div>
            <div className="text-sm text-white/60">{room.subtitle}</div>
          </div>

          <div className="flex gap-2">
            <Link href="/members" className="btn">Portal</Link>
            <Link href="/members/lounge" className="btn">All Rooms</Link>
            <a className="btn btnPrimary" href={room.jitsi} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
          </div>
        </div>

        <div className="glass rounded-3xl p-4 mt-4">
          <div className="frame">
            <iframe
              src={room.jitsi}
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
