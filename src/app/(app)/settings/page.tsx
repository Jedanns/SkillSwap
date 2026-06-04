import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      username: true,
      displayName: true,
      headline: true,
      bio: true,
      avatarUrl: true,
      githubUrl: true,
      linkedinUrl: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <SettingsForm email={profile?.email ?? user.email ?? ""} initial={profile ?? {}} />
    </div>
  );
}
