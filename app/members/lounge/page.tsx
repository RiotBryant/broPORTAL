"use client";

import Link from "next/link";
import { ROOM_ORDER, ROOMS, type RoomSlug } from "@/lib/rooms";

export default function LoungePage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">broLOUNGE</h1>
            <p className="mt-2 text-sm text-white/70">Choose a room.</p>
          </div>
          <Link href="/members" className="text-sm text-white/70 hover:text-white">
            ← Back to Portal
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {ROOM_ORDER.map((slug: RoomSlug) => (
            <Link
              key={slug}
              href={`/members/room/${slug}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10"
            >
              <div className="text-lg font-semibold">{ROOMS[slug].title}</div>
              <div className="mt-1 text-xs text-white/60">{slug}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
