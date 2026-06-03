import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { participantSelect, serializeMessage, serializeParticipant } from "@/lib/messages/serialize";
import type { MessageParticipant } from "@/components/messages/types";

const LIMIT = 30;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_profileId: { conversationId, profileId: user!.id },
    },
    select: { profileId: true },
  });

  if (!participant) redirect("/messages");

  const [rawMessages, participantRows] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      take: LIMIT + 1,
      orderBy: { createdAt: "desc" },
      include: { sender: { select: participantSelect } },
    }),
    prisma.conversationParticipant.findMany({
      where: { conversationId },
      include: { profile: { select: participantSelect } },
    }),
    prisma.conversationParticipant.update({
      where: {
        conversationId_profileId: { conversationId, profileId: user!.id },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  const hasMore = rawMessages.length > LIMIT;
  const messages = rawMessages.slice(0, LIMIT).reverse().map(serializeMessage);

  const participantsMap: Record<string, MessageParticipant> = {};
  for (const p of participantRows) {
    participantsMap[p.profileId] = serializeParticipant(p.profile);
  }

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={user!.id}
      initialMessages={messages}
      initialHasMore={hasMore}
      participants={participantsMap}
    />
  );
}
