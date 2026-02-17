import Link from "next/link";
import TopBar from "@/components/TopBar";
import VoteUI from "@/components/VoteUI";

export default function VotePage() {
  return (
    <>
      <TopBar title="Voting" subtitle="Polls (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <VoteUI />
    </>
  );
}
