import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  conversationInclude,
  serializeConversation,
} from "@/lib/messages/serialize";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const rows = await prisma.conversation.findMany({
    where: { participants: { some: { profileId: user.id } } },
    orderBy: { lastMessageAt: "desc" },
    include: conversationInclude(),
  });

  return Response.json({
    conversations: rows.map((r) => serializeConversation(r, user.id)),
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
  const targetUserId = typeof body?.userId === "string" ? body.userId.trim() : "";

  if (!targetUserId) {
    return Response.json({ error: "userId requis." }, { status: 400 });
  }
  if (targetUserId === user.id) {
    return Response.json({ error: "Impossible de se contacter soi-même." }, { status: 400 });
  }

  const targetProfile = await prisma.profile.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!targetProfile) {
    return Response.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { participants: { some: { profileId: user.id } } },
        { participants: { some: { profileId: targetUserId } } },
      ],
    },
    include: conversationInclude(),
  });

  if (existing) {
    return Response.json({ conversation: serializeConversation(existing, user.id) });
  }

  const created = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      participants: {
        create: [{ profileId: user.id }, { profileId: targetUserId }],
      },
    },
    include: conversationInclude(),
  });

  return Response.json(
    { conversation: serializeConversation(created, user.id) },
    { status: 201 },
  );
}
