export type MessageParticipant = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ConversationData = {
  id: string;
  type: "DIRECT";
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: boolean;
  otherParticipant: MessageParticipant;
};

export type MessageData = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: MessageParticipant;
};
