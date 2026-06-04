import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername } from "@/lib/profile/queries";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  return <ProfileView profile={profile} isSelf={profile.id === user.id} />;
}
