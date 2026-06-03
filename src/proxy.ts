import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Public routes — reachable whether or not the user is signed in.
// `/auth` must stay public so the email-confirmation handler can run.
const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth"];

// Signed-in users get bounced away from these (GET only — see below).
const AUTH_ENTRY_PATHS = ["/login", "/signup"];

// Next.js 16 renamed the `middleware` convention to `proxy`. This refreshes the
// Supabase session on every matched request and performs OPTIMISTIC redirects.
// Authoritative authorization lives in the (app) layout (getUser) and the
// server actions — never trust these claims for real authz decisions.
export async function proxy(request: NextRequest) {
  // Always refresh the session first so the auth cookies stay in sync.
  const { response, claims } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isAuthenticated = !!claims;

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Unauthenticated user on a protected route → login.
  if (!isAuthenticated && !isPublic) {
    return redirectWithCookies(request, response, "/login");
  }

  // Authenticated user landing on login/signup → home. GET only, so Server
  // Action POSTs to these routes (form submissions) are never hijacked.
  if (
    isAuthenticated &&
    request.method === "GET" &&
    AUTH_ENTRY_PATHS.includes(pathname)
  ) {
    return redirectWithCookies(request, response, "/home");
  }

  return response;
}

// Build a redirect while preserving the refreshed Supabase cookies.
function redirectWithCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export const config = {
  matcher: [
    /*
     * Run on all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - common image file extensions
     * NOTE: /auth/* is intentionally NOT excluded so the email-confirmation
     * route handler stays reachable.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
