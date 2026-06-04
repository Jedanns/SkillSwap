"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { updateProfileAction, type EditProfileState } from "./actions";

interface Props {
  email: string;
  initial: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    displayName?: string | null;
    headline?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
  };
}

const initialState: EditProfileState = {};
const inputClass =
  "w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/20";
const labelClass = "block text-sm font-medium text-ink mb-1";

export default function SettingsForm({ email, initial }: Props) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  return (
    <div className="rounded-3xl border border-hairline bg-surface p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black text-ink">Paramètres du profil</h1>
          <p className="text-sm text-muted-ink">{email}</p>
        </div>
        <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-medium text-ink transition hover:bg-powder/40">
          <ExternalLink className="size-4" /> Mon profil
        </Link>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className={labelClass}>Prénom <span className="text-red-500">*</span></label>
            <input id="firstName" name="firstName" required defaultValue={initial.firstName ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Nom <span className="text-red-500">*</span></label>
            <input id="lastName" name="lastName" required defaultValue={initial.lastName ?? ""} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="username" className={labelClass}>Nom d&apos;utilisateur</label>
            <input id="username" name="username" defaultValue={initial.username ?? ""} placeholder="ex. johndoe" className={inputClass} />
            <p className="mt-1 text-xs text-muted-ink">Utilisé dans l&apos;URL de votre profil public.</p>
          </div>
          <div>
            <label htmlFor="displayName" className={labelClass}>Nom d&apos;affichage</label>
            <input id="displayName" name="displayName" defaultValue={initial.displayName ?? ""} placeholder="Prénom Nom" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="headline" className={labelClass}>Titre / accroche</label>
          <input id="headline" name="headline" defaultValue={initial.headline ?? ""} placeholder="Ex. Développeur·se front-end · React" className={inputClass} />
        </div>

        <div>
          <label htmlFor="avatarUrl" className={labelClass}>Photo (URL)</label>
          <input id="avatarUrl" name="avatarUrl" type="url" defaultValue={initial.avatarUrl ?? ""} placeholder="https://…" className={inputClass} />
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>Bio</label>
          <textarea id="bio" name="bio" rows={3} defaultValue={initial.bio ?? ""} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="githubUrl" className={labelClass}>GitHub</label>
            <input id="githubUrl" name="githubUrl" type="url" defaultValue={initial.githubUrl ?? ""} placeholder="https://github.com/…" className={inputClass} />
          </div>
          <div>
            <label htmlFor="linkedinUrl" className={labelClass}>LinkedIn</label>
            <input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={initial.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/…" className={inputClass} />
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state.success && (
          <p className="flex items-center gap-1.5 rounded-lg border border-pistache/40 bg-pistache/10 px-3 py-2 text-sm font-medium text-deep-green">
            <CheckCircle2 className="size-4" /> Profil enregistré.
          </p>
        )}

        <button type="submit" disabled={isPending} className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-50">
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
