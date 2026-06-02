"use client";

import { useActionState } from "react";
import { completeAccountAction, type CompleteAccountState } from "./actions";

interface Props {
  token: string;
  email: string;
}

const initialState: CompleteAccountState = {};

export default function CompleteAccountForm({ token, email }: Props) {
  const boundAction = completeAccountAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Finalisez votre compte</h1>
      <p className="text-zinc-500 text-sm mb-6">
        Compte pour{" "}
        <span className="font-medium text-zinc-700">{email}</span>
      </p>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-1">
              Prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
            {state.fieldErrors?.firstName && (
              <p className="text-xs text-red-600 mt-1">{state.fieldErrors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-1">
              Nom
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
            {state.fieldErrors?.lastName && (
              <p className="text-xs text-red-600 mt-1">{state.fieldErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
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
          {state.fieldErrors?.password ? (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.password}</p>
          ) : (
            <p className="text-xs text-zinc-400 mt-1">
              8 caractères min. · 1 majuscule · 1 minuscule · 1 chiffre
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-1">
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
          {state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.confirmPassword}</p>
          )}
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
          {isPending ? "Activation en cours…" : "Activer mon compte"}
        </button>
      </form>
    </div>
  );
}
