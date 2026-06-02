"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";
import Link from "next/link";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Email envoyé !</h1>
        <p className="text-zinc-500 text-sm">
          Un email de finalisation de compte vous a été envoyé.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Créer un compte</h1>
      <p className="text-zinc-500 text-sm mb-6">
        Entrez votre adresse email institutionnelle.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="prenom.nom@etu-digitalschool.paris"
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
          {isPending ? "Envoi en cours…" : "Continuer"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-zinc-900 font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
