"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

import type { PostAuthor } from "./types";

function getDisplayName(a: PostAuthor) {
  if (a.display_name) return a.display_name;
  const parts = [a.first_name, a.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : (a.username ?? "Utilisateur");
}

function getInitials(a: PostAuthor) {
  return getDisplayName(a)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserHoverCard({ author }: { author: PostAuthor }) {
  const name = getDisplayName(author);
  const handle = author.username ? `@${author.username}` : null;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMessage() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: author.id }),
      });
      if (!res.ok) return;
      const { conversation } = await res.json();
      router.push(`/messages/${conversation.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="font-heading text-sm font-semibold text-foreground hover:underline underline-offset-2 focus:outline-none">
          {name}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-60 p-0 overflow-hidden"
        align="start"
        sideOffset={8}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {author.avatar_url && <AvatarImage src={author.avatar_url} alt={name} />}
              <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                {getInitials(author)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-foreground truncate">{name}</p>
              {handle && (
                <p className="text-xs text-muted-foreground truncate">{handle}</p>
              )}
            </div>
          </div>
        </div>
        <Separator />
        <div className="px-3 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={handleMessage}
            disabled={loading}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {loading ? "Ouverture…" : "Envoyer un message"}
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
