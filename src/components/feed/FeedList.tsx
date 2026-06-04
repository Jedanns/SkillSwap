"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useInView } from "react-intersection-observer";

import { createClient } from "@/lib/supabase/client";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import type { CommentData, PostAuthor, PostData } from "./types";

const FILTERS: { value: "ALL" | PostData["kind"]; label: string }[] = [
  { value: "ALL", label: "Tout" },
  { value: "GENERAL", label: "Général" },
  { value: "TUTORING_OFFER", label: "Tutorat" },
  { value: "ANNOUNCEMENT", label: "Annonces" },
];

type Props = {
  initialPosts: PostData[];
  initialHasMore: boolean;
  currentUserId: string;
  currentUserAuthor: PostAuthor;
};

function normalizePost(p: Record<string, unknown>): PostData {
  return {
    ...(p as PostData),
    createdAt:
      typeof p.createdAt === "string"
        ? p.createdAt
        : new Date(p.createdAt as string).toISOString(),
    comments: ((p.comments as Record<string, unknown>[]) ?? []).map(
      (c): CommentData => ({
        ...(c as CommentData),
        created_at:
          typeof c.created_at === "string"
            ? c.created_at
            : new Date(c.created_at as string).toISOString(),
      }),
    ),
  };
}

export function FeedList({ initialPosts, initialHasMore, currentUserId, currentUserAuthor }: Props) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | PostData["kind"]>("ALL");
  const cursorRef = useRef<string | null>(
    initialPosts.length > 0 ? initialPosts[initialPosts.length - 1].id : null,
  );

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  // Realtime: when anyone publishes, pull the first page and prepend new posts.
  const syncNewPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    if (!res.ok) return;
    const data = await res.json();
    const fresh: PostData[] = data.posts.map(normalizePost);
    setPosts((prev) => {
      const known = new Set(prev.map((p) => p.id));
      const toAdd = fresh.filter((p) => !known.has(p.id));
      return toAdd.length ? [...toAdd, ...prev] : prev;
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        syncNewPosts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncNewPosts]);

  useEffect(() => {
    if (!inView || !hasMore || loading) return;
    async function loadMore() {
      setLoading(true);
      try {
        const cursor = cursorRef.current;
        const res = await fetch(cursor ? `/api/posts?cursor=${cursor}` : "/api/posts");
        if (!res.ok) return;
        const data = await res.json();
        const next: PostData[] = data.posts.map(normalizePost);
        setPosts((prev) => [...prev, ...next]);
        setHasMore(data.hasMore);
        if (next.length > 0) cursorRef.current = next[next.length - 1].id;
      } finally {
        setLoading(false);
      }
    }
    loadMore();
  }, [inView, hasMore, loading]);

  const visiblePosts = filter === "ALL" ? posts : posts.filter((p) => p.kind === filter);

  return (
    <div className="flex flex-col gap-4">
      <CreatePost currentUserAuthor={currentUserAuthor} onPostCreated={(p) => setPosts((prev) => [p, ...prev])} />

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visiblePosts.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-border bg-card px-8 py-14 text-center">
          <p className="text-sm font-medium text-foreground">Aucune publication</p>
          <p className="mt-1 text-xs text-muted-foreground">Sois le premier à partager quelque chose !</p>
        </div>
      )}

      {visiblePosts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} currentUserAuthor={currentUserAuthor} />
      ))}

      {loading && <><PostCardSkeleton /><PostCardSkeleton /></>}

      {hasMore && !loading && <div ref={sentinelRef} className="h-4" />}

      {!hasMore && posts.length > 0 && (
        <p className="py-8 text-center text-xs text-muted-foreground">Tu as tout vu !</p>
      )}
    </div>
  );
}
