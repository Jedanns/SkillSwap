"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type EditProfileState = {
  error?: string;
  success?: boolean;
};

function normalizeUsername(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
}

export async function updateProfileAction(
  _prev: EditProfileState,
  formData: FormData,
): Promise<EditProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";
  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const rawUsername = (formData.get("username") as string | null)?.trim() ?? "";
  const username = rawUsername ? normalizeUsername(rawUsername) : null;
  if (rawUsername && (!username || username.length < 3)) {
    return { error: "Nom d'utilisateur invalide (3 caractères min, a-z, 0-9, -, _)." };
  }

  const displayName = (formData.get("displayName") as string | null)?.trim() || null;
  const headline = (formData.get("headline") as string | null)?.trim() || null;
  const bio = (formData.get("bio") as string | null)?.trim() || null;
  const avatarUrl = (formData.get("avatarUrl") as string | null)?.trim() || null;
  const githubUrl = (formData.get("githubUrl") as string | null)?.trim() || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string | null)?.trim() || null;

  try {
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        displayName: displayName ?? `${firstName} ${lastName}`,
        ...(username ? { username } : {}),
        headline,
        bio,
        avatarUrl,
        githubUrl,
        linkedinUrl,
        isProfileComplete: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Ce nom d'utilisateur est déjà pris." };
    }
    throw e;
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  return { success: true };
}
