import Link from "next/link";
import TopBar from "@/components/TopBar";
import FormUI from "@/components/FormUI";

export default function SupportPage() {
  return (
    <>
      <TopBar title="Request Support" subtitle="Submits to Admin Inbox (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <FormUI kind="support" />
    </>
  );
}
