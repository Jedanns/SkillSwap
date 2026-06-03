"use client";

import { useEffect, useRef, useState } from "react";

import { useInView } from "react-intersection-observer";

import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import type { CommentData, PostAuthor, PostData } from "./types";

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
  const cursorRef = useRef<string | null>(
    initialPosts.length > 0 ? initialPosts[initialPosts.length - 1].id : null,
  );

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

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

  return (
    <div className="flex flex-col gap-4">
      <CreatePost currentUserAuthor={currentUserAuthor} onPostCreated={(p) => setPosts((prev) => [p, ...prev])} />

      {posts.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-border bg-card px-8 py-14 text-center">
          <p className="text-sm font-medium text-foreground">Aucune publication</p>
          <p className="mt-1 text-xs text-muted-foreground">Sois le premier à partager quelque chose !</p>
        </div>
      )}

      {posts.map((post) => (
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
