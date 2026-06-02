"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import Link from "next/link";

interface Props {
  activated?: boolean;
}

const initialState: LoginState = {};

export default function LoginForm({ activated }: Props) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Se connecter</h1>
      <p className="text-zinc-500 text-sm mb-6">
        Bienvenue sur SkillSwap.
      </p>

      {activated && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Compte activé avec succès ! Vous pouvez maintenant vous connecter.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
          {isPending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-zinc-900 font-medium hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
