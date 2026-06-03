"use client";

import { useRef, useState } from "react";

import { ImageIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { EmojiPickerButton } from "./EmojiPicker";
import type { PostAuthor, PostData } from "./types";

const KINDS: { value: PostData["kind"]; label: string; color: string }[] = [
  { value: "GENERAL", label: "Général", color: "bg-foreground text-background" },
  { value: "TUTORING_OFFER", label: "Tutorat", color: "bg-brand-lime text-brand-lime-fg" },
  { value: "ANNOUNCEMENT", label: "Annonce", color: "bg-brand-forest text-brand-forest-fg" },
];

function getDisplayName(a: PostAuthor) {
  if (a.display_name) return a.display_name;
  const parts = [a.first_name, a.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : (a.username ?? "?");
}

function getInitials(a: PostAuthor) {
  return getDisplayName(a).split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type Props = { currentUserAuthor: PostAuthor; onPostCreated: (p: PostData) => void };

export function CreatePost({ currentUserAuthor, onPostCreated }: Props) {
  const [content, setContent] = useState("");
  const [kind, setKind] = useState<PostData["kind"]>("GENERAL");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track cursor position so emoji inserts at caret
  const cursorRef = useRef<number>(0);

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
  }

  function handleTextareaKeyUp(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    cursorRef.current = e.currentTarget.selectionStart ?? content.length;
  }

  function handleTextareaClick(e: React.MouseEvent<HTMLTextAreaElement>) {
    cursorRef.current = e.currentTarget.selectionStart ?? content.length;
  }

  function insertEmoji(emoji: string) {
    const pos = cursorRef.current;
    const next = content.slice(0, pos) + emoji + content.slice(pos);
    setContent(next);
    // Restore focus + move cursor after the inserted emoji
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const newPos = pos + [...emoji].length;
      el.setSelectionRange(newPos, newPos);
      cursorRef.current = newPos;
    });
  }

  async function handleSubmit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, kind }),
      });
      if (res.ok) {
        const { post } = await res.json();
        onPostCreated({
          ...post,
          createdAt: typeof post.createdAt === "string" ? post.createdAt : new Date(post.createdAt).toISOString(),
          comments: (post.comments ?? []).map(
            (c: { created_at: string | Date } & Record<string, unknown>) => ({
              ...c,
              created_at: typeof c.created_at === "string" ? c.created_at : new Date(c.created_at).toISOString(),
            }),
          ),
        });
        setContent("");
        setKind("GENERAL");
        setExpanded(false);
        cursorRef.current = 0;
      }
    } finally {
      setSubmitting(false);
    }
  }

  const name = getDisplayName(currentUserAuthor);

  return (
    <Card className="gap-0 py-0 rounded-xl overflow-hidden">
      <CardContent className="px-4 pt-4 pb-3">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 shrink-0 mt-0.5">
            {currentUserAuthor.avatar_url && <AvatarImage src={currentUserAuthor.avatar_url} />}
            <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
              {getInitials(currentUserAuthor)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {expanded && (
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{name}</p>
            )}
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyUp={handleTextareaKeyUp}
              onClick={handleTextareaClick}
              onFocus={() => setExpanded(true)}
              placeholder={expanded ? "Écris ta publication…" : `Quoi de neuf, ${name.split(" ")[0]} ?`}
              className={cn(
                "w-full resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed placeholder:text-muted-foreground/70",
                expanded ? "min-h-[96px]" : "min-h-[36px]",
              )}
            />
          </div>
        </div>
      </CardContent>

      {expanded && (
        <>
          <Separator />

          <div className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            {/* Kind pills */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Type :</span>
              {KINDS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                    kind === value ? color : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Toolbar + submit */}
            <div className="flex items-center gap-1 self-end shrink-0">
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" disabled>
                <ImageIcon className="h-4 w-4" />
              </Button>

              <EmojiPickerButton onSelect={insertEmoji} />

              <div className="w-px h-4 bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => { setExpanded(false); setContent(""); cursorRef.current = 0; }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!content.trim() || submitting}
                onClick={handleSubmit}
                className="text-xs"
              >
                {submitting ? "Publication…" : "Publier"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
