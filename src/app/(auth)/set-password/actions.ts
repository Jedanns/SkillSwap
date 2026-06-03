"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type SetPasswordState = {
  error?: string;
};

function validatePassword(password: string): string | null {
  // Only rule: at least 6 characters. No case/digit/symbol requirements.
  if (password.length < 6) return "6 caractères minimum.";
  return null;
}

/**
 * Sign-up step 2: the student has just confirmed their email (so they have an
 * active Supabase session) and now defines their password. `updateUser` writes
 * it to `auth.users`; afterwards they can sign in with email + password.
 */
export async function setPasswordAction(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword =
    (formData.get("confirmPassword") as string | null) ?? "";

  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();

  // Requires the session established by the confirmation link.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Votre session a expiré. Cliquez à nouveau sur le lien reçu par email.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Surface the real cause in the server logs (Vercel/host) for debugging.
    console.error(
      `[set-password] updateUser failed: status=${error.status} code=${error.code} message=${error.message}`,
    );

    if (error.code === "weak_password") {
      return {
        error:
          "Ce mot de passe est trop courant. Choisissez-en un autre, plus robuste.",
      };
    }

    // `same_password` means the account's password is already set to this value
    // (e.g. the student re-submitted after a first success). They're already
    // authenticated via the confirmation link, so the account is ready — just
    // send them into the app instead of showing an error.
    if (error.code === "same_password") {
      redirect("/home");
    }

    return {
      error: "Impossible de définir le mot de passe. Réessayez.",
    };
  }

  redirect("/home");
}
