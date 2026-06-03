import { FeedList } from "@/components/feed/FeedList";
import type { CommentData, PostAuthor, PostData } from "@/components/feed/types";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const LIMIT = 20;

const authorSelect = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  display_name: true,
  avatar_url: true,
} as const;

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? "";

  const currentUserProfile = user
    ? await prisma.profile.findUnique({
        where: { id: user.id },
        select: authorSelect,
      })
    : null;

  const currentUserAuthor: PostAuthor = currentUserProfile ?? {
    id: currentUserId,
    username: null,
    first_name: null,
    last_name: null,
    display_name: null,
    avatar_url: null,
  };

  const rawPosts = await prisma.post.findMany({
    take: LIMIT,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      likes: { select: { profile_id: true } },
      comments: {
        include: { profiles: { select: authorSelect } },
        orderBy: { created_at: "asc" },
      },
    },
  });

  const posts: PostData[] = rawPosts.map((p) => ({
    id: p.id,
    content: p.content,
    kind: p.kind,
    createdAt: p.createdAt.toISOString(),
    like_count: p.like_count,
    comment_count: p.comment_count,
    author: p.author,
    likes: p.likes,
    comments: p.comments.map(
      (c): CommentData => ({
        id: c.id,
        body: c.body,
        created_at: c.created_at.toISOString(),
        profiles: c.profiles,
      }),
    ),
  }));

  return (
    <div className="mx-auto w-full max-w-[680px] pb-12">
      <FeedList
        initialPosts={posts}
        initialHasMore={posts.length === LIMIT}
        currentUserId={currentUserId}
        currentUserAuthor={currentUserAuthor}
      />
    </div>
  );
}
