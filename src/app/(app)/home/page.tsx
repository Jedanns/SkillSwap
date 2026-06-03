import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/lib/auth/actions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The layout already guards this, but we need the id for the profile read.
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isProfileComplete: true, firstName: true, displayName: true },
  });

  // First-connection gate — force profile completion before the Home (Volet 2).
  if (!profile?.isProfileComplete) {
    redirect("/complete-profile");
  }

  const name = profile.displayName || profile.firstName || "étudiant";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-ink">Bienvenue sur SkillSwap</p>
          <h1 className="text-3xl font-bold text-ink">Salut {name} 👋</h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-canvas transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </header>

      <div className="mt-10 rounded-2xl border border-hairline bg-surface p-8">
        <h2 className="text-lg font-semibold text-ink">Votre espace</h2>
        <p className="mt-2 text-sm text-muted-ink">
          Votre compte est actif et votre profil est complété. Le tableau de
          bord (actualités, compétences, tutoring, planning…) arrive
          prochainement.
        </p>
      </div>
    </main>
  );
}
