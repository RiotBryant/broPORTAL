import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div style={{ padding: 22, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Admin</h1>
      <div style={{ opacity: 0.7, marginTop: 6 }}>Tools</div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <Link href="/members/admin/inbox" style={cardLink()}>
          <div style={{ fontWeight: 900 }}>Admin Inbox</div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>Approve / deny access requests</div>
        </Link>

        <Link href="/members" style={cardLink()}>
          <div style={{ fontWeight: 900 }}>Back to Members</div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>Return to the portal</div>
        </Link>
      </div>
    </div>
  );
}

function cardLink(): React.CSSProperties {
  return {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.28)",
    padding: 16,
    color: "white",
    textDecoration: "none",
  };
}
