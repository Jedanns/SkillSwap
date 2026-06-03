import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Email confirmation endpoint (Supabase Auth, server-side `verifyOtp` flow).
 *
 * Supabase emails a link of the shape
 *   /auth/confirm?token_hash=...&type=email&next=/set-password
 * (configured in the Auth email templates). Verifying the token here writes
 * the session cookies via the server client, so the user lands on `next`
 * already authenticated. This token_hash flow is device-independent — the link
 * works in any browser, unlike the PKCE `?code=` flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=auth");
}

/**
 * Only allow same-origin relative paths to prevent an open redirect. Anything
 * else (absolute URLs, protocol-relative `//host`, missing) falls back to /home.
 */
function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/home";
}
