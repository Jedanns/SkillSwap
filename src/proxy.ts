import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

// Public routes — always accessible whether logged in or not.
const PUBLIC_PATHS = ["/login", "/register", "/complete-account"];

// Auth routes — redirect to /dashboard when already logged in.
const AUTH_ONLY_PATHS = ["/login", "/register", "/complete-account"];

async function getSessionFromRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs before
// matched routes and handles session-based route protection.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const isAuthenticated = await getSessionFromRequest(request);

  // Redirect logged-in users away from auth pages
  if (isAuthenticated && AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // API routes handle their own auth — never redirect them
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  // Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Run on all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - common image file extensions
     * Adjust this so your auth callback routes stay reachable.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
