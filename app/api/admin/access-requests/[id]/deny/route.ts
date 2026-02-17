import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  const supabase = createClient();

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

  await supabase
    .from("access_requests")
    .update({ status: "denied" })
    .eq("id", ctx.params.id);

  return NextResponse.redirect(new URL("/members/admin/inbox", req.url), 303);
}
