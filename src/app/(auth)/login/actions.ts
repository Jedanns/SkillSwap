"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      accountStatus: true,
    },
  });

  // Use a generic message to avoid user enumeration
  const invalidMsg = "Email ou mot de passe incorrect.";

  if (!profile || !profile.passwordHash) {
    return { error: invalidMsg };
  }

  if (profile.accountStatus !== "ACTIVE") {
    return {
      error: "Votre compte n'est pas encore activé. Vérifiez vos emails.",
    };
  }

  const valid = await verifyPassword(password, profile.passwordHash);
  if (!valid) {
    return { error: invalidMsg };
  }

  await createSession({ profileId: profile.id, email: profile.email });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const { deleteSession } = await import("@/lib/auth/session");
  await deleteSession();
  redirect("/login");
}
