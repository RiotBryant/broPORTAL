import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  const supabase = createClient();
  const admin = createAdminClient();

  // Get logged in user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  // Check role
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleRow || roleRow.role !== "admin") {
    return NextResponse.redirect(new URL("/members", req.url), 303);
  }

  // Get request
  const { data: request } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", ctx.params.id)
    .single();

  if (!request || request.status !== "pending") {
    return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
  }

  // Create user in Supabase Auth
  const { data: newUser, error: createError } =
    await admin.auth.admin.createUser({
      email: request.email,
      email_confirm: true
    });

  if (createError) {
    return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
  }

  // Assign role
  await supabase.from("user_roles").insert({
    user_id: newUser.user.id,
    role: "member"
  });

  // Update request status
  await supabase
    .from("access_requests")
    .update({ status: "approved" })
    .eq("id", request.id);

  return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
}
