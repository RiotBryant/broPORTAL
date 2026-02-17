import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function normalize(x: string) {
  return x.trim().toLowerCase();
}

function hashAnswer(answer: string) {
  // simple SHA256; good enough for MVP (we can salt later)
  return crypto.createHash("sha256").update(normalize(answer)).digest("hex");
}

export async function POST(req: Request) {
  const { email, answer } = await req.json();

  if (!email || !answer) {
    return NextResponse.json({ error: "Email and answer required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) return NextResponse.json({ error: "Auth admin error" }, { status: 500 });

  const user = users.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("security_answer_hash")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profErr) return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });

  const expected = profile?.security_answer_hash;
  if (!expected) {
    return NextResponse.json(
      { error: "Security answer not set. Use Email reset or Ask admin." },
      { status: 400 }
    );
  }

  const got = hashAnswer(String(answer));
  if (got !== expected) return NextResponse.json({ error: "Incorrect answer" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
