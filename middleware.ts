import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PORTAL_PREFIX = "/members";
const LEGACY_PREFIXES = ["/portal", "/profile", "/lounge"];

type CookieToSet = { name: string; value: string; options?: any };

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Force legacy entrypoints into the one portal
  if (LEGACY_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = PORTAL_PREFIX;
    return NextResponse.redirect(url);
  }

  // Allow public routes without auth
  const isPublic =
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/" ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/favicon") ||
    path.startsWith("/robots.txt") ||
    path.startsWith("/sitemap");

  if (isPublic) return NextResponse.next();

  // Only protect members routes
  const isMembers = path === PORTAL_PREFIX || path.startsWith(PORTAL_PREFIX + "/");
  if (!isMembers) return NextResponse.next();

  // Create a response we can attach refreshed cookies to
  const res = NextResponse.next();

  // Supabase SSR client in middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies: CookieToSet[]) {
          cookies.forEach((cookie) => {
            res.cookies.set(cookie.name, cookie.value, cookie.options);
          });
        },
      },
    }
  );

  // If no user, bounce to /login with redirect back
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/members/:path*", "/portal/:path*", "/profile/:path*", "/lounge/:path*"],
};
