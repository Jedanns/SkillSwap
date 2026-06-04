import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { participantSelect, serializeMessage } from "@/lib/messages/serialize";

const LIMIT = 30;
const MAX_BODY = 4000;

const messageInclude = {
  sender: { select: participantSelect },
} as const;

async function verifyMembership(conversationId: string, profileId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId } },
    select: { profileId: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const member = await verifyMembership(id, user.id);
  if (!member) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const cursor = request.nextUrl.searchParams.get("cursor");

  const rows = await prisma.message.findMany({
    where: { conversationId: id },
    take: LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: messageInclude,
  });

  const hasMore = rows.length > LIMIT;
  const messages = rows.slice(0, LIMIT).map(serializeMessage);

  return Response.json({ messages, hasMore });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const member = await verifyMembership(id, user.id);
  if (!member) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json();
  const text = typeof body?.body === "string" ? body.body.trim() : "";

  if (!text) {
    return Response.json({ error: "Le message ne peut pas être vide." }, { status: 400 });
  }
  if (text.length > MAX_BODY) {
    return Response.json({ error: "Message trop long (max 4000 caractères)." }, { status: 400 });
  }

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId: id, profileId: { not: user.id } },
    select: { profileId: true },
  });

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: { conversationId: id, senderId: user.id, body: text },
      include: messageInclude,
    });

    await tx.conversation.update({
      where: { id },
      data: { lastMessageAt: msg.createdAt },
    });

    await tx.activityEvent.create({
      data: { profileId: user.id, type: "MESSAGE_SENT", xpAwarded: 0 },
    });

    if (otherParticipants.length > 0) {
      await tx.notification.createMany({
        data: otherParticipants.map((p) => ({
          recipientId: p.profileId,
          type: "MESSAGE_RECEIVED" as const,
          actorId: user.id,
          entityType: "conversation",
          entityId: id,
          data: { messagePreview: text.slice(0, 100) },
        })),
      });
    }

    return msg;
  });

  return Response.json({ message: serializeMessage(message) }, { status: 201 });
}
