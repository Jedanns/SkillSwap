import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessagesPanelShell } from "@/components/messages/MessagesPanelShell";
import { conversationInclude, serializeConversation } from "@/lib/messages/serialize";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rows = await prisma.conversation.findMany({
    where: { participants: { some: { profileId: user.id } } },
    orderBy: { lastMessageAt: "desc" },
    include: conversationInclude(user.id),
  });

  const conversations = rows.map((r) => serializeConversation(r, user.id));

  return (
    <MessagesPanelShell
      left={<ConversationList initialConversations={conversations} currentUserId={user.id} />}
    >
      {children}
    </MessagesPanelShell>
  );
}
