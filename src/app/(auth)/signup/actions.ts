"use server";

import { createClient } from "@/lib/supabase/server";
import { CAMPUS_DOMAIN, isCampusEmail } from "@/lib/auth/constants";

export type SignupState = {
  error?: string;
  success?: boolean;
};

/**
 * Sign-up step 1: the student enters only their campus email. We send a
 * Supabase confirmation link (native email). `shouldCreateUser: true` creates
 * the `auth.users` row — which fires the `on_auth_user_created` trigger that
 * mirrors it into `public.profiles`. No password yet; that's set after the
 * student clicks the link (see /auth/confirm → /set-password).
 *
 * Re-submitting the same email simply re-sends the link (no duplicate user),
 * which doubles as the recovery path if a link is lost or never used.
 */
export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "L'adresse email est requise." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Adresse email invalide." };
  }

  // Campus-only — instant UX guard. The DB CHECK constraint is the hard guard.
  if (!isCampusEmail(email)) {
    return {
      error: `Seules les adresses @${CAMPUS_DOMAIN} sont acceptées.`,
    };
  }

  // Strip any trailing slash so we never build a broken `//auth/confirm` link
  // (the Supabase "Site URL" is often stored with a trailing slash).
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/set-password`,
    },
  });

  if (error) {
    // Surface the real cause in the server logs (Vercel/host) for debugging.
    console.error(
      `[signup] signInWithOtp failed: status=${error.status} code=${error.code} message=${error.message}`,
    );

    // Rate limit = Supabase's built-in email sender is capped (test-only).
    // The real fix is configuring Custom SMTP in the Supabase dashboard.
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        error:
          "Trop de demandes d'email pour le moment. Patientez quelques minutes, puis réessayez.",
      };
    }

    return {
      error:
        "Impossible d'envoyer l'email pour le moment. Réessayez dans quelques instants.",
    };
  }

  return { success: true };
}
