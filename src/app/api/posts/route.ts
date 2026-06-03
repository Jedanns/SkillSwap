import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { postInclude, serializePost } from "@/lib/feed/serialize";

const LIMIT = 20;
const MAX_CONTENT = 2000;
const VALID_KINDS = ["GENERAL", "TUTORING_OFFER", "ANNOUNCEMENT"] as const;
type PostKind = (typeof VALID_KINDS)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");

  const posts = await prisma.post.findMany({
    take: LIMIT,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  return Response.json({
    posts: posts.map(serializePost),
    hasMore: posts.length === LIMIT,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json();
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const kind: PostKind = VALID_KINDS.includes(body?.kind) ? body.kind : "GENERAL";

  if (!content) {
    return Response.json({ error: "Le contenu est requis." }, { status: 400 });
  }
  if (content.length > MAX_CONTENT) {
    return Response.json({ error: "Le contenu est trop long." }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: { authorId: user.id, content, kind },
    include: postInclude,
  });

  return Response.json({ post: serializePost(post) }, { status: 201 });
}
