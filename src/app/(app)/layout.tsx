import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Authenticated area gate (Data Access Layer). Every route under `(app)`
 * requires a verified Supabase session — `getUser()` re-validates against the
 * Auth server (unlike the optimistic `getClaims()` check in the proxy) — and
 * renders inside the app shell (sidebar + header).
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <AppHeader />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
