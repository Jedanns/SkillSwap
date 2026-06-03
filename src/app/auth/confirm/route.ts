import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Email confirmation endpoint. Establishes the Supabase session from a
 * confirmation link, then forwards the user to `next` (e.g. /set-password),
 * already authenticated. Supports BOTH email-link styles so it works whatever
 * the dashboard email template is set to:
 *
 *  - `?code=...`                  → default `{{ .ConfirmationURL }}` template
 *                                   (PKCE; works in the same browser).
 *  - `?token_hash=...&type=email` → custom token_hash template
 *                                   (device-independent; works on any device).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = sanitizeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  // No usable token, or verification failed (e.g. the link expired / was
  // already used). Implicit-flow errors arrive in the URL hash, which the
  // server can't read — they simply land here.
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
