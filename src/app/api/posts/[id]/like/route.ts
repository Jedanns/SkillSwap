import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return Response.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_profileId: { postId, profileId: user.id } },
  });

  // Return the server's authoritative count so the client never drifts.
  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.postLike.delete({
        where: { postId_profileId: { postId, profileId: user.id } },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return Response.json({ liked: false, likeCount: updated.likeCount });
  }

  const [, updated] = await prisma.$transaction([
    prisma.postLike.create({ data: { postId, profileId: user.id } }),
    prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    }),
  ]);

  return Response.json({ liked: true, likeCount: updated.likeCount });
}
