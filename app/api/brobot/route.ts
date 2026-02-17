import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { question } = await req.json().catch(() => ({ question: "" }));

  // For now: deterministic “router” behavior.
  // Later: connect to whatever AI provider you choose.
  const q = String(question || "").trim();

  if (!q) return NextResponse.json({ answer: "Ask me something." });

  // Simple routing examples:
  if (q.toLowerCase().includes("support")) {
    return NextResponse.json({
      answer: "Go to Support. If it’s urgent, submit a request and it hits Admin Inbox.",
    });
  }

  return NextResponse.json({
    answer:
      "broBOT is online. I can route you: Support • Lounge • Forms • Admin Inbox. Tell me what you need.",
  });
}
