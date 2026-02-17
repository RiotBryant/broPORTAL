import Link from "next/link";
import TopBar from "@/components/TopBar";
import ChatUI from "@/components/ChatUI";

export default function ChatPage() {
  return (
    <>
      <TopBar title="broCHAT" subtitle="Group room (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <ChatUI />
    </>
  );
}
