import type { ConversationData, MessageData, MessageParticipant } from "@/components/messages/types";

export const participantSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
} as const;

type ParticipantRow = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

type ConversationParticipantRow = {
  profileId: string;
  lastReadAt: Date | null;
  profile: ParticipantRow;
};

type MessagePreviewRow = { body: string };

type ConversationRow = {
  id: string;
  type: string;
  lastMessageAt: Date | null;
  participants: ConversationParticipantRow[];
  messages: MessagePreviewRow[];
};

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  sender: ParticipantRow;
};

export function serializeParticipant(p: ParticipantRow): MessageParticipant {
  return {
    id: p.id,
    username: p.username,
    firstName: p.firstName,
    lastName: p.lastName,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
  };
}

export function serializeConversation(row: ConversationRow, currentUserId: string): ConversationData {
  const myParticipant = row.participants.find((p) => p.profileId === currentUserId);
  const other = row.participants.find((p) => p.profileId !== currentUserId);

  const lastMessageAt = row.lastMessageAt?.toISOString() ?? null;
  const lastReadAt = myParticipant?.lastReadAt ?? null;
  const unread =
    lastMessageAt !== null &&
    (lastReadAt === null || new Date(lastMessageAt) > lastReadAt);

  return {
    id: row.id,
    type: "DIRECT",
    lastMessageAt,
    lastMessagePreview: row.messages[0]?.body.slice(0, 80) ?? null,
    unread,
    otherParticipant: other
      ? serializeParticipant(other.profile)
      : { id: "", username: null, firstName: null, lastName: null, displayName: null, avatarUrl: null },
  };
}

export function serializeMessage(row: MessageRow): MessageData {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    sender: serializeParticipant(row.sender),
  };
}

export const conversationInclude = (currentUserId: string) => ({
  participants: {
    include: { profile: { select: participantSelect } },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { body: true },
  },
});
