import Link from "next/link";
import { store } from "@/lib/store";

export default function AdminInboxUI({ requestId }: { requestId?: string }) {
  const items = store.requests.list();
  const item = requestId ? store.requests.get(requestId) : null;

  if (requestId && item) {
    return (
      <div className="card">
        <div className="cardTitle">{item.subject}</div>
        <div className="cardSub">From: {item.from} • {new Date(item.ts).toLocaleString()}</div>
        <div className="cardDesc" style={{ marginTop: 12 }}>{item.body}</div>

        <div className="cardActions">
          <Link className="btn btnPrimary" href="/members/admin/inbox">Back to Inbox</Link>
          <Link className="btn btnGhost" href="/members">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="cardDesc">Admin Inbox (mock). Later: pull from Supabase requests table.</div>

      <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
        {items.length === 0 ? (
          <div style={{ padding: "12px 0", color: "rgba(255,255,255,0.65)" }}>No requests yet.</div>
        ) : items.map((r) => (
          <Link key={r.id} href={`/members/admin/inbox/${r.id}`}
            className="pill"
            style={{ display: "block", margin: "10px 0" }}>
            <div style={{ fontWeight: 800 }}>{r.subject}</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>{r.category} • from {r.from}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
