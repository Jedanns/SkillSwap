"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Heart, Loader2, MessageCircle, MoreHorizontal, Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { CommentSection } from "./CommentSection";
import type { CommentData, PostAuthor, PostData } from "./types";
import { UserHoverCard } from "./UserHoverCard";

type Props = { post: PostData; currentUserId: string; currentUserAuthor: PostAuthor };

const KIND_META: Record<PostData["kind"], { label: string; cls: string }> = {
  GENERAL: { label: "Général", cls: "bg-secondary text-secondary-foreground border-transparent" },
  TUTORING_OFFER: { label: "Tutorat", cls: "bg-brand-lime text-brand-lime-fg border-transparent" },
  ANNOUNCEMENT: { label: "Annonce", cls: "bg-brand-forest text-brand-forest-fg border-transparent" },
};

function getDisplayName(a: PostAuthor) {
  if (a.display_name) return a.display_name;
  const parts = [a.first_name, a.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : (a.username ?? "Utilisateur");
}

function getInitials(a: PostAuthor) {
  return getDisplayName(a).split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}j`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function PostCard({ post, currentUserId, currentUserAuthor }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likes.some((l) => l.profile_id === currentUserId));
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>(post.comments);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [contacting, setContacting] = useState(false);

  const isOwnPost = post.author.id === currentUserId;

  async function handleContact() {
    setContacting(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: post.author.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversation.id}`);
      }
    } finally {
      setContacting(false);
    }
  }

  async function handleLike() {
    const prevLiked = liked;
    const prevCount = likeCount;
    // Optimistic flip, then reconcile to the server's authoritative numbers.
    setLiked(!prevLiked);
    setLikeCount((n) => (prevLiked ? n - 1 : n + 1));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("like failed");
      const data = (await res.json()) as { liked: boolean; likeCount: number };
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }

  const { label, cls } = KIND_META[post.kind];
  const name = getDisplayName(post.author);

  return (
    <Card className="gap-0 py-0 rounded-xl group/post transition-shadow hover:shadow-sm">
      <CardContent className="px-4 pt-4 pb-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              {post.author.avatar_url && <AvatarImage src={post.author.avatar_url} alt={name} />}
              <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                {getInitials(post.author)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <UserHoverCard author={post.author} />
                <Badge className={cn("text-[10px] font-medium px-1.5 h-4 border rounded-full", cls)}>
                  {label}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {post.author.username && (
                  <span className="mr-1">@{post.author.username} ·</span>
                )}
                {relativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:flex shrink-0 opacity-0 group-hover/post:opacity-100 text-muted-foreground transition-opacity -mt-0.5"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <p className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {post.content}
        </p>
      </CardContent>

      <Separator />

      {/* Action bar */}
      <CardFooter className="bg-transparent border-0 px-2 py-1.5 gap-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "gap-1.5 rounded-lg text-xs font-normal h-8 px-2.5 transition-colors",
            liked
              ? "text-rose-500 hover:text-rose-500 hover:bg-rose-50"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4 transition-all", liked && "fill-rose-500 stroke-rose-500 scale-110")} />
          <span>{likeCount > 0 ? likeCount : "J'aime"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            "gap-1.5 rounded-lg text-xs font-normal h-8 px-2.5 transition-colors",
            showComments ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount > 0 ? commentCount : "Commenter"}</span>
        </Button>

        {!isOwnPost && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContact}
            disabled={contacting}
            className="ml-auto gap-1.5 rounded-lg text-xs font-normal h-8 px-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {contacting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Contacter</span>
          </Button>
        )}
      </CardFooter>

      {showComments && (
        <>
          <Separator />
          <CommentSection
            postId={post.id}
            comments={comments}
            currentUserId={currentUserId}
            currentUserAuthor={currentUserAuthor}
            onCommentAdded={(c) => { setComments((p) => [...p, c]); setCommentCount((n) => n + 1); }}
          />
        </>
      )}
    </Card>
  );
}
