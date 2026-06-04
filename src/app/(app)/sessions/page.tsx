import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SessionsView } from "@/components/sessions/SessionsView";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; propose?: string; skill?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isProfileComplete: true },
  });
  if (!profile?.isProfileComplete) redirect("/complete-profile");

  const { session, propose, skill } = await searchParams;
  return (
    <SessionsView
      currentUserId={user.id}
      initialSessionId={session ?? null}
      initialProposeStudentId={propose ?? null}
      initialProposeSkillId={skill ?? null}
    />
  );
}
