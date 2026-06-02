import { prisma } from "@/lib/prisma";
import CompleteAccountForm from "./form";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function CompleteAccountPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Lien invalide</h1>
        <p className="text-zinc-500 text-sm mb-4">
          Ce lien de finalisation est invalide ou manquant.
        </p>
        <Link href="/register" className="text-zinc-900 font-medium hover:underline text-sm">
          Créer un compte
        </Link>
      </div>
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { verificationToken: token },
    select: {
      accountStatus: true,
      verificationTokenExpiresAt: true,
      email: true,
    },
  });

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Lien invalide</h1>
        <p className="text-zinc-500 text-sm mb-4">
          Ce lien est invalide ou a déjà été utilisé.
        </p>
        <Link href="/register" className="text-zinc-900 font-medium hover:underline text-sm">
          Recommencer l&apos;inscription
        </Link>
      </div>
    );
  }

  if (profile.accountStatus === "ACTIVE") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Compte déjà activé</h1>
        <p className="text-zinc-500 text-sm mb-4">
          Votre compte est déjà actif.
        </p>
        <Link href="/login" className="text-zinc-900 font-medium hover:underline text-sm">
          Se connecter
        </Link>
      </div>
    );
  }

  if (
    !profile.verificationTokenExpiresAt ||
    profile.verificationTokenExpiresAt < new Date()
  ) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Lien expiré</h1>
        <p className="text-zinc-500 text-sm mb-4">
          Ce lien a expiré. Veuillez recommencer l&apos;inscription.
        </p>
        <Link href="/register" className="text-zinc-900 font-medium hover:underline text-sm">
          Recommencer l&apos;inscription
        </Link>
      </div>
    );
  }

  return <CompleteAccountForm token={token} email={profile.email} />;
}
