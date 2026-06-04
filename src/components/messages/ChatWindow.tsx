"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { GraduationCap, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useMessagesNotify } from "./MessagesPanelShell";
import { MessageInput } from "./MessageInput";
import type { MessageData, MessageParticipant } from "./types";

function participantName(p: MessageParticipant): string {
  if (p.displayName) return p.displayName;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return full || p.username || "Conversation";
}

function getInitials(p: MessageParticipant): string {
  if (p.displayName) return p.displayName.slice(0, 2).toUpperCase();
  const first = p.firstName?.[0] ?? "";
  const last = p.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageData[];
  initialHasMore: boolean;
  participants: Record<string, MessageParticipant>;
};

export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  initialHasMore,
  participants,
}: Props) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const oldestCursorRef = useRef<string | null>(
    initialMessages.length > 0 ? initialMessages[0].id : null,
  );
  const isNearBottomRef = useRef(true);

  const { ref: topSentinelRef, inView: topInView } = useInView({ threshold: 0 });
  const notifyConversationList = useMessagesNotify();
  const router = useRouter();

  const otherId = Object.keys(participants).find((id) => id !== currentUserId);
  const other = otherId ? participants[otherId] : undefined;

  // Scroll to bottom on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  // Track whether user is near bottom
  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }

  // Load older messages when top sentinel comes into view
  useEffect(() => {
    if (!topInView || !hasMore || loadingMore) return;

    async function loadMore() {
      setLoadingMore(true);
      const container = scrollContainerRef.current;
      const prevScrollHeight = container?.scrollHeight ?? 0;

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?cursor=${oldestCursorRef.current}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const older: MessageData[] = data.messages.slice().reverse();
        setMessages((prev) => [...older, ...prev]);
        setHasMore(data.hasMore);
        if (older.length > 0) {
          oldestCursorRef.current = older[0].id;
        }

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      } finally {
        setLoadingMore(false);
      }
    }

    loadMore();
  }, [topInView, hasMore, loadingMore, conversationId]);

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            const sender = participants[incoming.sender_id] ?? {
              id: incoming.sender_id,
              username: null,
              firstName: null,
              lastName: null,
              displayName: null,
              avatarUrl: null,
            };
            return [
              ...prev,
              {
                id: incoming.id,
                conversationId: incoming.conversation_id,
                senderId: incoming.sender_id,
                body: incoming.body,
                createdAt: incoming.created_at,
                sender,
              },
            ];
          });

          if (isNearBottomRef.current) {
            requestAnimationFrame(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, participants]);

  function handleMessageSent(message: MessageData) {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
    notifyConversationList({
      conversationId: message.conversationId,
      preview: message.body,
      sentAt: message.createdAt,
      senderId: message.senderId,
    });
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {other && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-white/95 px-4 py-2.5 backdrop-blur-sm">
          <Link href={other.username ? `/u/${other.username}` : "#"} className="flex min-w-0 items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={other.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">{getInitials(other)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-semibold text-foreground">{participantName(other)}</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {/* WebRTC audio/video — deferred (see docs/FOLLOWUP.md). Disabled, non-dead placeholder. */}
            <button type="button" disabled title="Appel audio (bientôt)" className="rounded-lg p-2 text-muted-foreground/50 cursor-not-allowed" aria-label="Appel audio (bientôt)">
              <Phone className="h-4 w-4" />
            </button>
            <button type="button" disabled title="Appel vidéo (bientôt)" className="rounded-lg p-2 text-muted-foreground/50 cursor-not-allowed" aria-label="Appel vidéo (bientôt)">
              <Video className="h-4 w-4" />
            </button>
            {otherId && (
              <button
                type="button"
                onClick={() => router.push(`/sessions?propose=${otherId}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:bg-foreground/85"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Proposer une session
              </button>
            )}
          </div>
        </div>
      )}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
      >
        <div ref={topSentinelRef} className="h-1" />

        {loadingMore && (
          <div className="flex flex-col gap-2 mb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-end gap-2">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <Skeleton className="h-8 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {messages.length === 0 && !loadingMore && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Commence la conversation !</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          const prev = messages[i - 1];
          const showAvatar = !isOwn && prev?.senderId !== msg.senderId;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
            >
              {!isOwn && (
                <div className="shrink-0 w-7">
                  {showAvatar && (
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={msg.sender.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(msg.sender)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}

              <div className={`group flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.body}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <MessageInput conversationId={conversationId} onMessageSent={handleMessageSent} />
    </div>
  );
}
