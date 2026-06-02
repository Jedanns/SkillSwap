"use server";

import { prisma } from "@/lib/prisma";
import { isAllowedDomain } from "@/lib/auth/session";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "@/lib/auth/token";
import { sendAccountCompletionEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "L'adresse email est requise." };
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Adresse email invalide." };
  }

  // Domain allowlist
  if (!isAllowedDomain(email)) {
    const allowed = process.env.ALLOWED_EMAIL_DOMAINS ?? "domaine autorisé";
    return {
      error: `Seules les adresses @${allowed.replace(/,/g, ", @")} sont acceptées.`,
    };
  }

  // Prevent duplicate registration for ACTIVE accounts
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    if (existing.accountStatus === "ACTIVE") {
      return {
        error: "Un compte actif existe déjà avec cette adresse email.",
      };
    }
    // PENDING — refresh the token and resend the email
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiry();
    await prisma.profile.update({
      where: { email },
      data: {
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
      },
    });
    await sendAccountCompletionEmail(email, token);
    return { success: true };
  }

  const token = generateVerificationToken();
  const expiresAt = getTokenExpiry();

  await prisma.profile.create({
    data: {
      email,
      accountStatus: "PENDING",
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    },
  });

  await sendAccountCompletionEmail(email, token);

  return { success: true };
}
