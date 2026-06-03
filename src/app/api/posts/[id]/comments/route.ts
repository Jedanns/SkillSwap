import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { authorSelect, serializeComment } from "@/lib/feed/serialize";

const MAX_CONTENT = 2000;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await ctx.params;

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: authorSelect } },
  });

  return Response.json({ comments: comments.map(serializeComment) });
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
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id: postId } = await ctx.params;
  const body = await request.json();
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return Response.json({ error: "Le contenu est requis." }, { status: 400 });
  }
  if (content.length > MAX_CONTENT) {
    return Response.json({ error: "Le contenu est trop long." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return Response.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { postId, authorId: user.id, body: content },
      include: { author: { select: authorSelect } },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  return Response.json({ comment: serializeComment(comment) }, { status: 201 });
}
