import Link from "next/link";
import TopBar from "@/components/TopBar";
import DMUI from "@/components/DMUI";

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  return (
    <>
      <TopBar title={`DM Thread: ${params.threadId}`} subtitle="Conversation (skeleton)" right={<Link className="pill" href="/members/inbox">← Inbox</Link>} />
      <DMUI initialThreadId={...} />
    </>
  );
}
