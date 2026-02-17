import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  const supabase = createClient();
  const admin = createAdminClient();

  // 1️⃣ Check logged in admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleRow || roleRow.role !== "admin") {
    return NextResponse.redirect(new URL("/members", req.url), 303);
  }

  // 2️⃣ Get request
  const { data: request } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", ctx.params.id)
    .single();

  if (!request || request.status !== "pending") {
    return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
  }

  // 3️⃣ Create user in Supabase Auth
  const { data: newUser, error } =
    await admin.auth.admin.createUser({
      email: request.email,
      email_confirm: true,
      password: crypto.randomUUID() // temporary random password
    });

  if (error || !newUser?.user) {
    return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
  }

  // 4️⃣ Assign role
  await supabase.from("user_roles").insert({
    user_id: newUser.user.id,
    role: "member"
  });

  // 5️⃣ Send password reset email
  await admin.auth.admin.generateLink({
    type: "recovery",
    email: request.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    }
  });

  // 6️⃣ Mark approved
  await supabase
    .from("access_requests")
    .update({ status: "approved" })
    .eq("id", request.id);

  return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
}
