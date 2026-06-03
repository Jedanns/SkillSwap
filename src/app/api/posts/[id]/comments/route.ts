import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const authorSelect = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  display_name: true,
  avatar_url: true,
} as const;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await ctx.params;

  const comments = await prisma.comments.findMany({
    where: { post_id: postId },
    orderBy: { created_at: "asc" },
    include: { profiles: { select: authorSelect } },
  });

  return Response.json({ comments });
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await ctx.params;
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const [comment] = await prisma.$transaction([
    prisma.comments.create({
      data: { post_id: postId, author_id: user.id, body: content.trim() },
      include: { profiles: { select: authorSelect } },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { comment_count: { increment: 1 } },
    }),
  ]);

  return Response.json({ comment }, { status: 201 });
}
