import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      {/* Top section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs tracking-widest text-white/50">broTHER collecTive</div>
        <div className="mt-1 text-3xl font-semibold text-white">Admin Dashboard</div>
        <div className="mt-2 text-sm text-white/60">
          Keep it clean: tools on the left, action here.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/members/admin/access-requests"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Open Access Requests →
          </Link>

          <Link
            href="/members"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
          >
            Member Portal →
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white/85">Access Requests</div>
          <div className="mt-2 text-sm text-white/60">
            Review + approve new brothers safely.
          </div>
          <div className="mt-4">
            <Link
              href="/members/admin/access-requests"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
            >
              View requests
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white/85">Admin Inbox</div>
          <div className="mt-2 text-sm text-white/60">
            Anything routed to admin lives here.
          </div>
          <div className="mt-4">
            <Link
              href="/members/admin/inbox"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
            >
              Open inbox
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white/85">Events</div>
          <div className="mt-2 text-sm text-white/60">
            Manage meeting schedule + announcements.
          </div>
          <div className="mt-4">
            <Link
              href="/members/admin/events"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
            >
              Open events
            </Link>
          </div>
        </div>
      </div>

      {/* Lower wide panel */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm font-semibold text-white/85">Coming next</div>
        <div className="mt-2 text-sm text-white/60">
          Member approvals • role manager • broadcast announcements • moderation queue
        </div>
      </div>
    </div>
  );
}
