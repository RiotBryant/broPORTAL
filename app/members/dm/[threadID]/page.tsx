import DMUI from "@/components/DMUI";

export default function DMThreadPage({ params }: { params: { threadId: string } }) {
  return <DMUI initialThreadId={params.threadId} />;
}
