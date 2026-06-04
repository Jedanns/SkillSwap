"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMessagesSubscribe } from "./MessagesPanelShell";
import { ConversationItem } from "./ConversationItem";
import type { ConversationData } from "./types";

type Props = {
  initialConversations: ConversationData[];
  currentUserId: string;
};

export function ConversationList({ initialConversations, currentUserId }: Props) {
  const [conversations, setConversations] = useState<ConversationData[]>(initialConversations);
  const pathname = usePathname();
  const subscribe = useMessagesSubscribe();

  const applyMessageUpdate = useCallback(
    (conversationId: string, preview: string, sentAt: string, senderId: string) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (!exists) return prev;
        const updated = prev.map((conv) =>
          conv.id !== conversationId
            ? conv
            : {
                ...conv,
                lastMessageAt: sentAt,
                lastMessagePreview: preview.slice(0, 80),
                unread: senderId !== currentUserId,
              },
        );
        return [...updated].sort((a, b) =>
          (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
        );
      });
    },
    [currentUserId],
  );

  // Update preview immediately when the current user sends a message
  useEffect(() => {
    return subscribe(({ conversationId, preview, sentAt, senderId }) => {
      applyMessageUpdate(conversationId, preview, sentAt, senderId);
    });
  }, [subscribe, applyMessageUpdate]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("conversation-list-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as {
            conversation_id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };

          // Own messages are already handled synchronously by the context — skip them here
          if (msg.sender_id === currentUserId) return;

          setConversations((prev) => {
            const exists = prev.some((c) => c.id === msg.conversation_id);

            if (!exists) {
              // New conversation started by another user — fetch its full data and add it
              fetch(`/api/conversations`)
                .then((r) => r.json())
                .then(({ conversations }: { conversations: ConversationData[] }) => {
                  const incoming = conversations.find((c) => c.id === msg.conversation_id);
                  if (!incoming) return;
                  setConversations((cur) => {
                    if (cur.some((c) => c.id === incoming.id)) return cur;
                    return [incoming, ...cur];
                  });
                })
                .catch(() => {});
              return prev;
            }

            const updated = prev.map((conv) =>
              conv.id !== msg.conversation_id
                ? conv
                : {
                    ...conv,
                    lastMessageAt: msg.created_at,
                    lastMessagePreview: msg.body.slice(0, 80),
                    unread: true,
                  },
            );
            return [...updated].sort((a, b) =>
              (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
            );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  function handleConversationClick(convId: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: false } : c)),
    );
    fetch(`/api/conversations/${convId}/read`, { method: "PATCH" });
  }

  return (
    <div className="w-72 xl:w-80 shrink-0 border-r flex flex-col overflow-hidden bg-background">
      <div className="px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-semibold">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 h-full text-center p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Aucune conversation. Contacte un autre utilisateur pour commencer.
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={pathname === `/messages/${conv.id}`}
              onClick={() => handleConversationClick(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
