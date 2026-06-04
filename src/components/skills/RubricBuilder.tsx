"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Loader2, Plus, Trash2 } from "lucide-react";

/** Expert tool: define the evaluation referential (scale, passing score, notions). */
export function RubricBuilder({ slug }: { slug: string }) {
  const [scale, setScale] = useState<"OUT_OF_10" | "OUT_OF_20">("OUT_OF_20");
  const [passingScore, setPassingScore] = useState(10);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    let active = true;
    fetch(`/api/skills/${encodeURIComponent(slug)}/rubric`)
      .then((r) => (r.ok ? r.json() : { rubric: null }))
      .then((data: { rubric: { scale: "OUT_OF_10" | "OUT_OF_20"; passingScore: number; criteria: { label: string }[] } | null }) => {
        if (active && data.rubric) {
          setScale(data.rubric.scale);
          setPassingScore(data.rubric.passingScore);
          setCriteria(data.rubric.criteria.map((c) => c.label));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);

  const max = scale === "OUT_OF_10" ? 10 : 20;

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(slug)}/rubric`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scale, passingScore: Math.min(passingScore, max), criteria }),
      });
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }

  function addCriterion() {
    if (input.trim()) {
      setCriteria((c) => [...c, input.trim()]);
      setInput("");
    }
  }

  return (
    <div className="rounded-2xl border border-powder bg-powder/10 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ClipboardCheck className="size-4 text-deep-green" /> Référentiel d&apos;évaluation (expert)
      </p>
      <p className="mt-0.5 text-xs text-muted-ink">Définissez le barème et les notions à valider pour certifier un élève.</p>

      <div className="mt-3 flex items-center gap-3">
        <select value={scale} onChange={(e) => setScale(e.target.value as "OUT_OF_10" | "OUT_OF_20")} className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-ink">
          <option value="OUT_OF_20">Sur 20</option>
          <option value="OUT_OF_10">Sur 10</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-ink">
          Seuil :
          <input type="number" min={1} max={max} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="w-16 rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-ink" />
          /{max}
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCriterion(); } }}
          placeholder="Notion à valider…"
          className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
        />
        <button type="button" onClick={addCriterion} className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-canvas">
          <Plus className="size-4" />
        </button>
      </div>
      {criteria.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm text-ink">
              <CheckCircle2 className="size-3.5 text-muted-ink" />
              <span className="flex-1">{c}</span>
              <button type="button" onClick={() => setCriteria((cs) => cs.filter((_, idx) => idx !== i))} className="text-muted-ink hover:text-red-500">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={save} disabled={status === "saving"} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80 disabled:opacity-60">
        {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
        {status === "saved" ? "Enregistré !" : "Enregistrer le référentiel"}
      </button>
    </div>
  );
}
