import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("requests").insert({
    category: "password_reset",
    subject: "Password reset help requested",
    body: `Member needs reset help. Email: ${email}`,
    visibility: "admin",
    status: "open",
    urgent_note: null,
  });

  if (error) return NextResponse.json({ error: "Could not create admin ticket" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
