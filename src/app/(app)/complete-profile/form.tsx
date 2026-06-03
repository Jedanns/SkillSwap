"use client";

import { useActionState, useState } from "react";
import {
  completeProfileAction,
  type CompleteProfileState,
} from "./actions";

interface Props {
  email: string;
  initial?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    headline?: string | null;
    bio?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
  };
}

const initialState: CompleteProfileState = {};

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent";
const labelClass = "block text-sm font-medium text-zinc-700 mb-1";

export default function CompleteProfileForm({ email, initial }: Props) {
  const [state, formAction, isPending] = useActionState(
    completeProfileAction,
    initialState,
  );

  // Save stays disabled until both required fields are filled (Volet 2).
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const requiredFilled =
    firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        Complétez votre profil
      </h1>
      <p className="text-zinc-500 text-sm mb-6">
        Quelques infos avant d&apos;accéder à votre espace.{" "}
        <span className="font-medium text-zinc-700">{email}</span>
      </p>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="displayName" className={labelClass}>
            Nom d&apos;affichage
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={initial?.displayName ?? ""}
            placeholder="Laissez vide pour utiliser Prénom Nom"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="headline" className={labelClass}>
            Titre / accroche
          </label>
          <input
            id="headline"
            name="headline"
            type="text"
            defaultValue={initial?.headline ?? ""}
            placeholder="Ex. Développeur·se front-end · passionné·e de React"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={initial?.bio ?? ""}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="githubUrl" className={labelClass}>
              GitHub
            </label>
            <input
              id="githubUrl"
              name="githubUrl"
              type="url"
              defaultValue={initial?.githubUrl ?? ""}
              placeholder="https://github.com/…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="linkedinUrl" className={labelClass}>
              LinkedIn
            </label>
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={initial?.linkedinUrl ?? ""}
              placeholder="https://linkedin.com/in/…"
              className={inputClass}
            />
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !requiredFilled}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Enregistrement…" : "Sauvegarder et continuer"}
        </button>
      </form>
    </div>
  );
}
