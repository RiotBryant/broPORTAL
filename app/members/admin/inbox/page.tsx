import Link from "next/link";
import TopBar from "@/components/TopBar";
import AdminInboxUI from "@/components/AdminInboxUI";

export default function AdminInboxPage() {
  return (
    <>
      <TopBar title="Admin Inbox" subtitle="Requests + access + support (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <AdminInboxUI />
    </>
  );
}
