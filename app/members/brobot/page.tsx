import Link from "next/link";
import TopBar from "@/components/TopBar";
import BroBotUI from "@/components/BroBotUI";

export default function BroBotPage() {
  return (
    <>
      <TopBar title="broBOT" subtitle="Guidance + routing (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <BroBotUI />
    </>
  );
}
