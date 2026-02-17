import Link from "next/link";
import TopBar from "@/components/TopBar";
import DMUI from "@/components/DMUI";

export default function InboxPage() {
  return (
    <>
      <TopBar title="DM Inbox" subtitle="Direct messages (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <DMUI />
    </>
  );
}
