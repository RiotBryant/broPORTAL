"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Role = "member" | "admin" | "superadmin";

type RoomRow = {
  id: string;
  slug: string;
  name: string;
  min_role: Role;
  sort_order: number | null;
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
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.replace("/login?next=/members/lounge");
        return;
      }

      const userId = sess.session.user.id;

      // Load role directly from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      const userRole: Role =
        (profile?.role as Role) || "member";

      setRole(userRole);

      // Load rooms
      const { data, error } = await supabase
        .from("rooms")
        .select("id,slug,name,min_role,sort_order")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error(error);
        setErr("Failed to load rooms.");
        setLoading(false);
        return;
      }

      const visible =
        (data as RoomRow[])?.filter((r) =>
          canSee(userRole, r.min_role)
        ) || [];

      setRooms(visible);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white grid place-items-center">
        <div className="opacity-70 text-sm">Loading rooms…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white grid place-items-center">
        <div className="text-sm text-red-400">{err}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              broLOUNGE
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Choose a room.
            </p>
          </div>

          <Link
            href="/members"
            className="text-sm text-white/70 hover:text-white"
          >
            ← Back to Portal
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {rooms.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-white/60">
              No rooms available for your role:{" "}
              <b>{role}</b>
            </div>
          )}

          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/members/room/${room.slug}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
            >
              <div className="text-lg font-semibold">
                {room.name}
              </div>
              <div className="mt-1 text-xs text-white/60">
                slug: {room.slug} • min role: {room.min_role}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
