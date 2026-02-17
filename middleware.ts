import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PORTAL_PREFIX = "/members";
const LEGACY_PREFIXES = ["/portal", "/profile", "/lounge"];

// Members routes that must stay PUBLIC (no auth required)
const PUBLIC_MEMBERS_ROUTES = new Set<string>([
  "/members/request-access",
  "/members/reset-password",
]);

function isPublicMembersPath(path: string) {
  if (PUBLIC_MEMBERS_ROUTES.has(path)) return true;
  // allow nested under these if you add later
  if (path.startsWith("/members/request-access/")) return true;
  if (path.startsWith("/members/reset-password/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1) Force legacy entrypoints into the one portal
  if (LEGACY_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = PORTAL_PREFIX;
    return NextResponse.redirect(url);
  }

  // Only protect /members/*
  if (!(path === PORTAL_PREFIX || path.startsWith(PORTAL_PREFIX + "/"))) {
    return NextResponse.next();
  }

  // 2) Allow public member routes (request access, reset password)
  if (isPublicMembersPath(path)) {
    return NextResponse.next();
  }

  // 3) Supabase-auth gate for everything else under /members
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // If env vars missing, don't hard-crash middleware — but you DO need them set.
  if (!supabaseUrl || !supabaseAnonKey) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    url.searchParams.set("e", "missing_supabase_env");
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          res.cookies.set(cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
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
