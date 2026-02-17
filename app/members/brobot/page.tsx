
"use client";

import Image from "next/image";
import Link from "next/link";

export default function BrobotPage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          background:
            "radial-gradient(55% 55% at 50% 0%, rgba(70,170,255,0.18), transparent 65%), radial-gradient(40% 40% at 20% 30%, rgba(236,72,153,0.07), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/members"
          className="text-sm text-white/60 hover:text-white"
        >
          ← Back to Portal
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur">
          <div className="flex items-center gap-5">
            {/* subtle pulse */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl blur-2xl animate-pulse bg-[#46AAFF]/15" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/45 p-3">
                {/* expects /public/brobot.png */}
                <Image
                  src="/brobot.png"
                  alt="broBOT"
                  width={110}
                  height={110}
                  priority
                />
              </div>
            </div>

            <div>
              <div className="text-2xl font-semibold tracking-tight">
                broBOT Chamber
              </div>
              <div className="mt-2 text-sm text-white/70">
                Space-mode companion for guidance, grounding, and routing.
              </div>
              <div className="mt-2 text-xs text-white/55">
                Built to support. Built to respond. Built for real help.
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <div className="text-sm text-white/80">
                Coming soon (Phase 2)
              </div>
              <div className="mt-2 text-sm text-white/60">
                broBOT will live inside the portal—not as a messy widget. He’ll
                help route requests, answer questions, and hand off to admins
                when a human is needed.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/members/support"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/85 hover:border-white/25 hover:text-white"
              >
                Request Support
              </Link>

              <Link
                href="/members"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-medium text-white hover:border-[#46AAFF]/45 hover:shadow-[0_0_28px_rgba(70,170,255,0.18)]"
              >
                Back to Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-white/45">
          Quiet by design. Presence over performance.
        </div>
      </div>
    </div>
  );
}
