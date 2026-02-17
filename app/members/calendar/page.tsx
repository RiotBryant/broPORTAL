import Link from "next/link";
import TopBar from "@/components/TopBar";
import CalendarUI from "@/components/CalendarUI";

export default function CalenderPage() {
  return (
    <>
      <TopBar
        title="Calendar"
        subtitle="Events + flyers + descriptions"
        right={<Link className="pill" href="/members">← Back</Link>}
      />
      <CalendarUI />
    </>
  );
}
