"use client";

import { useState } from "react";

import { Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { CommentData, PostAuthor } from "./types";
import { UserHoverCard } from "./UserHoverCard";

type Props = {
  postId: string;
  comments: CommentData[];
  currentUserId: string;
  currentUserAuthor: PostAuthor;
  onCommentAdded: (comment: CommentData) => void;
};

function getDisplayName(a: PostAuthor) {
  if (a.display_name) return a.display_name;
  const parts = [a.first_name, a.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : (a.username ?? "?");
}

function getInitials(a: PostAuthor) {
  return getDisplayName(a).split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export function CommentSection({
  postId,
  comments,
  currentUserAuthor,
  onCommentAdded,
}: Props) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        onCommentAdded({
          ...comment,
          created_at:
            typeof comment.created_at === "string"
              ? comment.created_at
              : new Date(comment.created_at).toISOString(),
        });
        setValue("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pb-4 pt-0 space-y-3">
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                {c.profiles.avatar_url && <AvatarImage src={c.profiles.avatar_url} />}
                <AvatarFallback className="text-[9px] font-semibold bg-muted text-muted-foreground">
                  {getInitials(c.profiles)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="inline-block max-w-full rounded-xl rounded-tl-sm bg-muted px-3 py-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <UserHoverCard author={c.profiles} />
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {relativeTime(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground leading-snug break-words">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Avatar className="h-6 w-6 shrink-0 mb-0.5">
          {currentUserAuthor.avatar_url && <AvatarImage src={currentUserAuthor.avatar_url} />}
          <AvatarFallback className="text-[9px] font-semibold bg-muted text-muted-foreground">
            {getInitials(currentUserAuthor)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 min-w-0 items-end gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 focus-within:border-foreground/20 focus-within:bg-white transition-colors">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Écrire un commentaire…"
            className="flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 min-h-[20px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button
            type="submit"
            size="icon-sm"
            variant={value.trim() ? "default" : "ghost"}
            disabled={!value.trim() || submitting}
            className="shrink-0 mb-0.5"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
