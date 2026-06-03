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
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await ctx.params;

  const existing = await prisma.postLike.findUnique({
    where: { postId_profile_id: { postId, profile_id: user.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({
        where: { postId_profile_id: { postId, profile_id: user.id } },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { like_count: { decrement: 1 } },
      }),
    ]);
    return Response.json({ liked: false });
  }

  await prisma.$transaction([
    prisma.postLike.create({
      data: { postId, profile_id: user.id },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { like_count: { increment: 1 } },
    }),
  ]);

  return Response.json({ liked: true });
}
