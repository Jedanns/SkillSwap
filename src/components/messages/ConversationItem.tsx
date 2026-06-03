"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationData } from "./types";

function getInitials(p: ConversationData["otherParticipant"]): string {
  if (p.displayName) return p.displayName.slice(0, 2).toUpperCase();
  const first = p.firstName?.[0] ?? "";
  const last = p.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function getDisplayName(p: ConversationData["otherParticipant"]): string {
  if (p.displayName) return p.displayName;
  if (p.firstName || p.lastName) return [p.firstName, p.lastName].filter(Boolean).join(" ");
  return p.username ?? "Utilisateur";
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

type Props = {
  conversation: ConversationData;
  isActive: boolean;
  onClick: () => void;
};

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const { otherParticipant: p } = conversation;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-muted/60"
      }`}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={p.avatarUrl ?? undefined} alt={getDisplayName(p)} />
        <AvatarFallback className="text-xs">{getInitials(p)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium truncate">{getDisplayName(p)}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {conversation.lastMessagePreview ?? "Aucun message"}
        </p>
      </div>

      {conversation.unread && (
        <span className="size-2 rounded-full bg-primary shrink-0" />
      )}
    </Link>
  );
}
