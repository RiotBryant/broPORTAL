import Link from "next/link";
import TopBar from "@/components/TopBar";
import BadgesUI from "@/components/BadgesUI";

export default function BadgesPage() {
  return (
    <>
      <TopBar title="Badges" subtitle="Recognition + roles (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <BadgesUI />
    </>
  );
}
