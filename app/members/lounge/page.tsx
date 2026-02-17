import Link from "next/link";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";

export default function LoungePage() {
  const rooms = mockRooms();

  return (
    <>
      <TopBar
        title="broLOUNGE"
        subtitle="Live rooms • choose your door"
        right={<Link className="pill" href="/members">← Back</Link>}
      />

      <div className="grid">
        {rooms.map((r) => (
          <Card
            key={r.slug}
            title={r.name}
            subtitle={r.slug}
            desc="Jitsi room entry point (skeleton)."
            actions={<Link className="btn btnPrimary" href={`/members/room/${r.slug}`}>Enter Room</Link>}
          />
        ))}
      </div>
    </>
  );
}
