import Link from "next/link";
import TopBar from "@/components/TopBar";
import { mockRoomUrl } from "@/lib/mock";

export default function RoomPage({ params }: { params: { slug: string } }) {
  const url = mockRoomUrl(params.slug);

  return (
    <>
      <TopBar
        title={`Room: ${params.slug}`}
        subtitle="Jitsi embed placeholder (swap to real embed later)"
        right={<Link className="pill" href="/members/lounge">← Lounge</Link>}
      />

      <div className="card" style={{ marginTop: 10 }}>
        <div className="cardTitle">Join Link</div>
        <div className="cardDesc">{url}</div>

        <div className="cardActions">
          <a className="btn btnPrimary" href={url} target="_blank" rel="noreferrer">Open in new tab</a>
          <Link className="btn btnGhost" href="/members">Back Home</Link>
        </div>
      </div>
    </>
  );
}
