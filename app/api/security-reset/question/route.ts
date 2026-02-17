import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find user by email
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) return NextResponse.json({ error: "Auth admin error" }, { status: 500 });

  const user = users.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("security_question")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profErr) return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });

  if (!profile?.security_question) {
    return NextResponse.json(
      { error: "Security question not set. Use Email reset or Ask admin." },
      { status: 400 }
    );
  }

  return NextResponse.json({ question: profile.security_question });
}
