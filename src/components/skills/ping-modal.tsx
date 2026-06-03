"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, X, Zap } from "lucide-react";
import type { Skill } from "./types";

interface PingModalProps {
  skill: Skill;
  onClose: () => void;
}

export function PingModal({ skill, onClose }: PingModalProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/pings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, message }),
      });
      if (res.status === 409) {
        setErrorMsg("Vous avez déjà un ping ouvert pour cette compétence.");
        setStatus("error");
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setErrorMsg("Une erreur est survenue, réessayez.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-peach/20">
                <Zap className="h-4 w-4 text-peach" />
              </div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-ink">
                Ping
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold text-ink">Demander un tutorat</h2>
            <p className="mt-0.5 text-sm text-muted-ink">
              Compétence :{" "}
              <span className="font-semibold text-ink">{skill.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline transition-colors hover:bg-canvas"
          >
            <X className="h-4 w-4 text-muted-ink" />
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pistache/30">
              <CheckCircle2 className="h-7 w-7 text-deep-green" />
            </div>
            <p className="font-semibold text-ink">Ping envoyé !</p>
            <p className="text-sm text-muted-ink">
              Un expert en <span className="font-medium">{skill.name}</span> sera notifié.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/80"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Message (facultatif)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Bonjour, je cherche un tuteur en ${skill.name}…`}
                rows={4}
                maxLength={400}
                className="w-full resize-none rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
              />
              <p className="mt-1 text-right text-xs text-muted-ink">{message.length}/400</p>
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-hairline bg-surface py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/80 disabled:opacity-60"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Envoyer le ping
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
