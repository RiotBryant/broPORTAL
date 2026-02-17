import Link from "next/link";
import TopBar from "@/components/TopBar";
import AdminInboxUI from "@/components/AdminInboxUI";

export default function AdminRequestPage({ params }: { params: { id: string } }) {
  return (
    <>
      <TopBar title={`Request: ${params.id}`} subtitle="Admin view (skeleton)" right={<Link className="pill" href="/members/admin/inbox">← Inbox</Link>} />
      <AdminInboxUI requestId={params.id} />
    </>
  );
}
