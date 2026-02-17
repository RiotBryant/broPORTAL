import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: any };

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies: CookieToSet[]) {
          cookies.forEach((c) => res.cookies.set(c.name, c.value, c.options));
        }
      }
    }
  );

  const path = req.nextUrl.pathname;
  const isMembers = path === "/members" || path.startsWith("/members/");

  if (!isMembers) return res;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/members/:path*"]
};
