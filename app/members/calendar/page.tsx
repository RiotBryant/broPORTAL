import Link from "next/link";
import TopBar from "@/components/TopBar";
import CalendarUI from "@/components/CalendarUI";

export default function CalendarPage() {
  return (
    <>
      <TopBar title="Calendar" subtitle="Events + countdown (skeleton)" right={<Link className="pill" href="/members">← Back</Link>} />
      <CalendarUI />
    </>
  );
}
