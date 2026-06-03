import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CompleteProfileForm from "./form";

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      isProfileComplete: true,
      firstName: true,
      lastName: true,
      displayName: true,
      headline: true,
      bio: true,
      githubUrl: true,
      linkedinUrl: true,
    },
  });

  // Already completed — no need to stay on this page.
  if (profile?.isProfileComplete) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <CompleteProfileForm
          email={profile?.email ?? user.email ?? ""}
          initial={profile ?? undefined}
        />
      </div>
    </div>
  );
}
