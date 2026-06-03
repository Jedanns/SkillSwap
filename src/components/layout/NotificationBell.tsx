"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  isRead: boolean;
  createdAt: string;
  conversationId: string | null;
  messagePreview: string | null;
  actor: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
};

function getDisplayName(actor: NotificationItem["actor"]): string {
  if (!actor) return "Quelqu'un";
  if (actor.displayName) return actor.displayName;
  const parts = [actor.firstName, actor.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (actor.username ?? "Utilisateur");
}

function getInitials(actor: NotificationItem["actor"]): string {
  const name = getDisplayName(actor);
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

type Props = {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
  currentUserId: string;
};

export function NotificationBell({ initialNotifications, initialUnreadCount, currentUserId }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const markingRead = useRef(false);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  // Realtime: listen for new MESSAGE_RECEIVED notifications addressed to this user
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const n = payload.new as { type: string };
          if (n.type !== "MESSAGE_RECEIVED") return;
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refetch]);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0 && !markingRead.current) {
      markingRead.current = true;
      // Optimistically clear the badge immediately
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications/read", { method: "PATCH" }).catch(() => {});
      markingRead.current = false;
    }
  }

  function handleNotificationClick(conversationId: string | null) {
    if (!conversationId) return;
    setOpen(false);
    router.push(`/messages/${conversationId}`);
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden" sideOffset={8}>
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-10 text-center px-4">
              <Bell className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Aucune notification pour le moment.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n.conversationId)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={n.actor?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">{getInitials(n.actor)}</AvatarFallback>
                  </Avatar>
                  {!n.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary border border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-semibold">{getDisplayName(n.actor)}</span>
                    {" vous a envoyé un message"}
                  </p>
                  {n.messagePreview && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {n.messagePreview}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
