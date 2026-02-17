import { NextResponse, type NextRequest } from "next/server";

// Skeleton mode: no Supabase yet.
// This middleware enforces ONE portal URL shape and a simple password gate cookie.
// Later, we’ll swap this to Supabase cookies, but the routing stays.

const PORTAL_PREFIX = "/members";
const LEGACY_PREFIXES = ["/portal", "/profile", "/lounge"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Force legacy entrypoints into the one portal
  if (LEGACY_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = PORTAL_PREFIX;
    return NextResponse.redirect(url);
  }

  // Protect members routes with a simple cookie gate for now:
  // If cookie "brot_gate" is not set, redirect to /login
  if (path === PORTAL_PREFIX || path.startsWith(PORTAL_PREFIX + "/")) {
    const gate = req.cookies.get("brot_gate")?.value;
    if (!gate) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/members/:path*", "/portal/:path*", "/profile/:path*", "/lounge/:path*"]
};
