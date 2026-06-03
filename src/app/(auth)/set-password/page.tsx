"use client";

import { useActionState } from "react";
import { setPasswordAction, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = {};

export default function SetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    setPasswordAction,
    initialState,
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        Définissez votre mot de passe
      </h1>
      <p className="text-zinc-500 text-sm mb-6">
        Dernière étape pour activer votre compte SkillSwap.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <p className="text-xs text-zinc-400 mt-1">
            6 caractères minimum.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Enregistrement…" : "Activer mon compte"}
        </button>
      </form>
    </div>
  );
}
