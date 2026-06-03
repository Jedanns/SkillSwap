import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every matched request and writes the
 * refreshed cookies onto a single response object. Call this from the root
 * proxy (see src/proxy.ts).
 *
 * Returns the refreshed `response` AND the verified JWT `claims` so the proxy
 * can make optimistic redirect decisions without creating a second client.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  claims: unknown | null;
}> {
  let supabaseResponse = NextResponse.next({ request });

  // Don't store this client in a global — create a new one per request so it
  // reads the current request's cookies.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do NOT run any code between createServerClient and getClaims().
  // Refreshing the token here keeps the browser and server sessions in sync;
  // inserting logic in between can randomly log users out.
  const { data } = await supabase.auth.getClaims();

  // The session cookie is now refreshed on `supabaseResponse`. Route protection
  // is intentionally left off so public pages render out of the box. To gate
  // routes, read the user and redirect when missing — keep /login and /auth
  // public to avoid redirect loops:
  //
  //   const { data } = await supabase.auth.getClaims();
  //   if (!data?.claims && !request.nextUrl.pathname.startsWith("/login")) {
  //     const url = request.nextUrl.clone();
  //     url.pathname = "/login";
  //     return NextResponse.redirect(url);
  //   }
  //
  // SECURITY: never make authorization decisions from user-editable claims
  // (user_metadata). Use app_metadata / a roles table guarded by RLS instead.

  // IMPORTANT: return `supabaseResponse` as-is so its refreshed cookies survive.
  // If the proxy builds a different response (e.g. a redirect), it must copy the
  // cookies over first:  newResponse.cookies.setAll(response.cookies.getAll());
  return { response: supabaseResponse, claims: data?.claims ?? null };
}
