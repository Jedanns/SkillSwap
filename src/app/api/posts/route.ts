import { NextRequest } from "next/server";

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

const commentsInclude = {
  orderBy: { created_at: "asc" as const },
  include: { profiles: { select: authorSelect } },
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");

  const posts = await prisma.post.findMany({
    take: LIMIT,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      likes: { select: { profile_id: true } },
      comments: commentsInclude,
    },
  });

  return Response.json({ posts, hasMore: posts.length === LIMIT });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, kind } = body;

  if (!content?.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      content: content.trim(),
      kind: kind ?? "GENERAL",
    },
    include: {
      author: { select: authorSelect },
      likes: { select: { profile_id: true } },
      comments: commentsInclude,
    },
  });

  return Response.json({ post }, { status: 201 });
}
