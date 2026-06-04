"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { describeNotification, type NotificationItem } from "@/lib/notifications/serialize";
import { profileInitials } from "@/lib/profile/display";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
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

  // Realtime: any new notification for this user.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${currentUserId}` },
        () => refetch(),
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
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications/read", { method: "PATCH" }).catch(() => {});
      markingRead.current = false;
    }
  }

  function handleClick(href: string) {
    setOpen(false);
    if (href) router.push(href);
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 overflow-hidden p-0" sideOffset={8}>
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Aucune notification pour le moment.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { text, href, preview } = describeNotification(n);
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(href)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!n.isRead ? "bg-primary/5" : ""}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={n.actor?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {n.actor ? profileInitials(n.actor) : "•"}
                      </AvatarFallback>
                    </Avatar>
                    {!n.isRead && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border border-background bg-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">{text}</p>
                    {preview && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{preview}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatTime(n.createdAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
