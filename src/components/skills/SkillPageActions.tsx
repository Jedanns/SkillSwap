"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck, Image as ImageIcon, Loader2, Pencil, Plus, Zap } from "lucide-react";
import { RubricBuilder } from "@/components/skills/RubricBuilder";

type Mine = {
  id: string;
  tier: string;
  level: number;
  customTitle: string | null;
  customDescription: string | null;
  customImageUrl: string | null;
} | null;

const btn = "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50";

export function SkillPageActions({
  skillId,
  slug,
  skillName,
  isCertified,
  mine,
  topExpertId,
  autoEdit = false,
}: {
  skillId: string;
  slug: string;
  skillName: string;
  isCertified: boolean;
  mine: Mine;
  topExpertId: string | null;
  autoEdit?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(autoEdit && !!mine);

  async function addToProfile() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/user/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      if (res.ok || res.status === 409) {
        setMsg("Compétence ajoutée à votre profil.");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "Impossible d'ajouter la compétence.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function ping() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      if (res.ok) setMsg("Ping envoyé — les détenteurs sont notifiés.");
      else if (res.status === 409) setMsg("Vous avez déjà un ping ouvert pour cette compétence.");
      else setMsg("Échec de l'envoi du ping.");
    } finally {
      setBusy(false);
    }
  }

  async function requestEvaluation() {
    if (!topExpertId) {
      setMsg("Aucun expert disponible pour le moment.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: topExpertId }),
      });
      if (res.ok) {
        const d = await res.json();
        router.push(`/messages/${d.conversation.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  // Holder view: customize + (expert) rubric builder.
  if (mine) {
    const isExpert = mine.tier === "EXPERT" || mine.tier === "MASTER";
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pistache/20 px-3 py-1 text-sm font-medium text-deep-green">
              <CheckCircle2 className="size-4" /> Vous détenez cette compétence (niveau {mine.level})
            </span>
            <button onClick={() => setEditing((v) => !v)} className={`${btn} bg-canvas text-ink ring-1 ring-hairline hover:bg-powder/40`}>
              <Pencil className="size-4" /> Personnaliser ma version
            </button>
          </div>
          {msg && <p className="mt-3 text-sm font-medium text-deep-green">{msg}</p>}
          {editing && <CustomizeForm mine={mine} onSaved={() => { setEditing(false); router.refresh(); }} />}
        </div>
        {isExpert && <RubricBuilder slug={slug} />}
      </div>
    );
  }

  // Certified + not holder: must be evaluated.
  if (isCertified) {
    return (
      <div className="rounded-2xl border border-pistache/40 bg-pistache/10 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ClipboardCheck className="size-4 text-deep-green" /> Compétence certifiée
        </p>
        <p className="mt-0.5 text-sm text-muted-ink">
          {skillName} ne peut pas être auto-attribuée. Passez une évaluation avec un expert pour l&apos;obtenir et pouvoir l&apos;enseigner.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={requestEvaluation} disabled={busy || !topExpertId} className={`${btn} bg-ink text-surface hover:bg-ink/85`}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />} Demander une évaluation
          </button>
          <button onClick={ping} disabled={busy} className={`${btn} bg-canvas text-ink ring-1 ring-hairline hover:bg-powder/40`}>
            <Zap className="size-4 text-peach" /> Signaler mon intérêt
          </button>
        </div>
        {msg && <p className="mt-3 text-sm font-medium text-ink">{msg}</p>}
      </div>
    );
  }

  // Free skill, not held yet.
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="text-sm font-semibold text-ink">Cette compétence vous intéresse ?</p>
      <p className="mt-0.5 text-sm text-muted-ink">Ajoutez-la à votre profil, ou demandez un tutorat aux détenteurs.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={addToProfile} disabled={busy} className={`${btn} bg-ink text-surface hover:bg-ink/85`}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Ajouter à mon profil
        </button>
        <button onClick={ping} disabled={busy} className={`${btn} bg-canvas text-ink ring-1 ring-hairline hover:bg-powder/40`}>
          <Zap className="size-4 text-peach" /> Demander un tutorat
        </button>
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-deep-green">{msg}</p>}
      <input type="hidden" value={slug} readOnly />
    </div>
  );
}

function CustomizeForm({ mine, onSaved }: { mine: NonNullable<Mine>; onSaved: () => void }) {
  const [title, setTitle] = useState(mine.customTitle ?? "");
  const [description, setDescription] = useState(mine.customDescription ?? "");
  const [imageUrl, setImageUrl] = useState(mine.customImageUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/user/skills/${mine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customTitle: title, customDescription: description, customImageUrl: imageUrl }),
      });
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20";

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-hairline bg-canvas/50 p-4">
      <p className="text-xs text-muted-ink">
        Votre version s&apos;affiche sur la page publique si vous êtes le détenteur le plus avancé. La description accepte les retours à la ligne.
      </p>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-ink">Titre personnalisé</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. React — de zéro à la prod" className={field} />
      </div>
      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-ink"><ImageIcon className="size-3.5" /> Image (URL)</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" placeholder="https://…" className={field} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-ink">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Présentez la compétence, le programme, votre approche…" className={`${field} resize-y`} />
      </div>
      <button onClick={save} disabled={busy} className={`${btn} bg-ink text-surface hover:bg-ink/85`}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Enregistrer ma version
      </button>
    </div>
  );
}
