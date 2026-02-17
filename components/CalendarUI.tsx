import { mockEvents } from "@/lib/mock";

export default function CalendarUI() {
  const events = mockEvents();
  return (
    <div className="card">
      <div className="cardDesc">Calendar skeleton. Later: events table.</div>
      <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
        {events.map((e) => (
          <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight: 900 }}>{e.title}</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>{new Date(e.when).toLocaleString()} • {e.location}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
