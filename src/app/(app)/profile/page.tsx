import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/profile/queries";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(user.id);
  if (!profile) redirect("/complete-profile");

  return <ProfileView profile={profile} isSelf />;
}
