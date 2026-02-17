import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email, newPassword } = await req.json();

  if (!email || !newPassword) {
    return NextResponse.json({ error: "Email and new password required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) return NextResponse.json({ error: "Auth admin error" }, { status: 500 });

  const user = users.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return NextResponse.json({ error: "Reset failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
