"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageData } from "./types";

type Props = {
  conversationId: string;
  onMessageSent: (message: MessageData) => void;
};

export function MessageInput({ conversationId, onMessageSent }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setBody("");

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        setBody(trimmed);
        return;
      }
      const data = await res.json();
      onMessageSent(data.message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const remaining = 4000 - body.length;

  return (
    <div className="border-t px-4 py-3 flex items-end gap-2 bg-background shrink-0">
      <div className="flex-1 min-w-0">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écris un message… (Entrée pour envoyer)"
          className="resize-none min-h-[40px] max-h-[120px]"
          disabled={sending}
        />
        {body.length > 3800 && (
          <p className={`text-[10px] mt-1 ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {remaining} caractères restants
          </p>
        )}
      </div>
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!body.trim() || sending || body.length > 4000}
        className="shrink-0 mb-0.5"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
