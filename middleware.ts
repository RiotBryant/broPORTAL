import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LEGACY_PREFIXES = ["/portal", "/profile", "/lounge"];

const PUBLIC_PATHS = new Set([
  "/login",
  "/members/request-access",
  "/members/reset-password",
]);

function isLegacy(pathname: string) {
  return LEGACY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isMembers(pathname: string) {
  return pathname === "/members" || pathname.startsWith("/members/");
}

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;

  // Allow nested routes under public paths if you add them later
  if (pathname.startsWith("/members/request-access/")) return true;
  if (pathname.startsWith("/members/reset-password/")) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1) Force ONE portal entrypoint
  if (isLegacy(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/members";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 2) If not a members route or it's public, let it through
  if (!isMembers(pathname) || isPublic(pathname)) {
    return NextResponse.next();
  }

  // 3) Protect members routes using Supabase session cookies
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach((c) => res.cookies.set(c.name, c.value, c.options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/members/:path*", "/portal/:path*", "/profile/:path*", "/lounge/:path*"],
};
