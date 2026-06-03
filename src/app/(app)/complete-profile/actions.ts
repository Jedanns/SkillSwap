"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type CompleteProfileState = {
  error?: string;
};

export async function completeProfileAction(
  _prev: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const displayName =
    (formData.get("displayName") as string | null)?.trim() || null;
  const headline = (formData.get("headline") as string | null)?.trim() || null;
  const bio = (formData.get("bio") as string | null)?.trim() || null;
  const githubUrl =
    (formData.get("githubUrl") as string | null)?.trim() || null;
  const linkedinUrl =
    (formData.get("linkedinUrl") as string | null)?.trim() || null;

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      displayName: displayName ?? `${firstName} ${lastName}`,
      headline,
      bio,
      githubUrl,
      linkedinUrl,
      isProfileComplete: true,
      onboardedAt: new Date(),
    },
  });

  redirect("/home");
}
