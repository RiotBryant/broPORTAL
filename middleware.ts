import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PORTAL_PREFIX = "/members";
const LEGACY_PREFIXES = ["/portal", "/profile", "/lounge"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Redirect legacy routes into ONE portal
  if (LEGACY_PREFIXES.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = PORTAL_PREFIX;
    return NextResponse.redirect(url);
  }

  // Protect members routes
  if (
    req.nextUrl.pathname === PORTAL_PREFIX ||
    req.nextUrl.pathname.startsWith(PORTAL_PREFIX + "/")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/members/:path*", "/portal/:path*", "/profile/:path*", "/lounge/:path*"],
};
