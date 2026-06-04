"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";

export function ContactButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function contact() {
    setBusy(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversation.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={contact}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
      Contacter
    </button>
  );
}
