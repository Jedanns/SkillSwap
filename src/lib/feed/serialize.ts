import type { CommentData, PostAuthor, PostData } from "@/components/feed/types";

/**
 * The Prisma schema uses camelCase fields (firstName, likeCount, …); the feed
 * client components consume a flatter snake_case DTO. These helpers are the
 * single boundary between the two, shared by the feed page (SSR) and the
 * /api/posts routes so both always emit the exact same shape.
 */

export const authorSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
} as const;

export const postInclude = {
  author: { select: authorSelect },
  likes: { select: { profileId: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: authorSelect } },
  },
} as const;

type AuthorRow = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  author: AuthorRow;
};

type PostRow = {
  id: string;
  content: string;
  kind: PostData["kind"];
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  author: AuthorRow;
  likes: { profileId: string }[];
  comments: CommentRow[];
};

export function serializeAuthor(a: AuthorRow): PostAuthor {
  return {
    id: a.id,
    username: a.username,
    first_name: a.firstName,
    last_name: a.lastName,
    display_name: a.displayName,
    avatar_url: a.avatarUrl,
  };
}

export function serializeComment(c: CommentRow): CommentData {
  return {
    id: c.id,
    body: c.body,
    created_at: c.createdAt.toISOString(),
    profiles: serializeAuthor(c.author),
  };
}

export function serializePost(p: PostRow): PostData {
  return {
    id: p.id,
    content: p.content,
    kind: p.kind,
    createdAt: p.createdAt.toISOString(),
    like_count: p.likeCount,
    comment_count: p.commentCount,
    author: serializeAuthor(p.author),
    likes: p.likes.map((l) => ({ profile_id: l.profileId })),
    comments: p.comments.map(serializeComment),
  };
}
