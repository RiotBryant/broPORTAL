import Link from "next/link";
import DMUI from "@/components/DMUI";
import TopBar from "@/components/TopBar";

export default function DMDeepLinkPage({
  params,
}: {
  params: { threadId: string; messageId: string };
}) {
  return (
    <>
      <TopBar
        title={`DM Thread: ${params.threadId}`}
        subtitle="Conversation"
        right={<Link className="pill" href="/members/inbox">← Inbox</Link>}
      />
      <DMUI initialThreadId={params.threadId} />
    </>
  );
}
