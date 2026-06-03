import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated area gate (Data Access Layer). Every route under `(app)`
 * requires a verified Supabase session — `getUser()` re-validates against the
 * Auth server (unlike the optimistic `getClaims()` check in the proxy).
 *
 * The profile-completion redirect is intentionally NOT here: it lives in the
 * individual pages (e.g. /home) so it doesn't loop on /complete-profile.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div className="min-h-screen bg-canvas">{children}</div>;
}
