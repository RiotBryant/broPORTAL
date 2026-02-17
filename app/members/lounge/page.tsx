"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getMyRole, isAdminRole } from "@/lib/store";

type Room = {
  slug: string;
  title: string;
  subtitle: string | null;
  is_admin_only: boolean;
};

export default function LoungePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace(`/login?next=${encodeURIComponent("/members/lounge")}`);
        return;
      }

     import type { Role } from "@/lib/store";

const role: Role = await getMyRole().catch(() => "member" as Role);
setIsAdmin(isAdminRole(role));

      setIsAdmin(isAdminRole(role));

      const { data: rows } = await supabase
        .from("rooms")
        .select("slug,title,subtitle,is_admin_only")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      setRooms((rows ?? []) as Room[]);
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
      <div className="wrap" style={{ width: "min(980px, calc(100% - 24px))", margin: "0 auto", padding: "24px 0 36px" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">broT Lounge</div>
            <div className="text-sm text-white/60">Choose a room. Nothing auto-joins.</div>
          </div>

          <div className="flex gap-2">
            <Link href="/members" className="btn">← Back</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {rooms
            .filter((r) => !r.is_admin_only || isAdmin)
            .map((r) => (
              <Link
                key={r.slug}
                href={`/members/room/${r.slug}`}
                className="card hover:opacity-95 transition"
              >
                <div className="text-base font-semibold">{r.title}</div>
                <div className="text-sm text-white/65 mt-1">{r.subtitle}</div>
                <div className="mt-4">
                  <span className="btn btnPrimary">Enter</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
