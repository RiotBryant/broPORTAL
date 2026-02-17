import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const form = await req.formData();

  const full_name = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  if (!full_name || !email || !message) {
    return NextResponse.redirect(new URL("/members/request-access", req.url), 303);
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("access_requests")
    .insert({
      full_name,
      email,
      message,
      status: "pending"
    });

  if (error) {
    return NextResponse.redirect(new URL("/members/request-access", req.url), 303);
  }

  return NextResponse.redirect(new URL("/members/request-access?submitted=true", req.url), 303);
}
