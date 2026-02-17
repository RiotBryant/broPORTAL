import { mockBadges, mockMe } from "@/lib/mock";

export default function BadgesUI() {
  const me = mockMe();
  const badges = mockBadges();

  return (
    <div className="grid">
      <div className="card">
        <div className="cardTitle">Your Badges</div>
        <div className="cardDesc">Skeleton. Later: badges table + awards.</div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {me.badges.map((b) => (
            <div key={b} className="chip"><b>{b}</b></div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">All Badges</div>
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {badges.map((b) => (
            <div key={b.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontWeight: 900 }}>{b.name}</div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
