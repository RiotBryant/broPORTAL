import Link from "next/link";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";

export default function FormsHub() {
  return (
    <>
      <TopBar title="Forms" subtitle="Everything routes to Admin Inbox" right={<Link className="pill" href="/members">← Back</Link>} />

      <div className="grid">
        <Card title="Request Access" subtitle="New members" desc="Goes to Admin Inbox." actions={<Link className="btn btnPrimary" href="/members/request-access">Open</Link>} />
        <Card title="Support Request" subtitle="Members" desc="Goes to Admin Inbox." actions={<Link className="btn btnPrimary" href="/members/support">Open</Link>} />
        <Card title="General Request" subtitle="Members" desc="Goes to Admin Inbox." actions={<Link className="btn btnPrimary" href="/members/support?mode=general">Open</Link>} />
      </div>
    </>
  );
}
