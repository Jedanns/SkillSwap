import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { participantSelect } from "@/lib/messages/serialize";
import { NotificationBell } from "./NotificationBell";

const NOTIF_LIMIT = 20;

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = user
    ? await prisma.notification.findMany({
        where: { recipientId: user.id, type: "MESSAGE_RECEIVED" },
        orderBy: { createdAt: "desc" },
        take: NOTIF_LIMIT,
        include: { actor: { select: participantSelect } },
      })
    : [];

  const unreadCount = rows.filter((n) => !n.isRead).length;

  const notifications = rows.map((n) => ({
    id: n.id,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    conversationId: n.entityId ?? null,
    messagePreview:
      n.data && typeof n.data === "object" && "messagePreview" in n.data
        ? String((n.data as Record<string, unknown>).messagePreview)
        : null,
    actor: n.actor
      ? {
          id: n.actor.id,
          displayName: n.actor.displayName,
          firstName: n.actor.firstName,
          lastName: n.actor.lastName,
          username: n.actor.username,
          avatarUrl: n.actor.avatarUrl,
        }
      : null,
  }));

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-sm">
      {/* Search */}
      <div className="flex flex-1 justify-center">
        <label className="flex w-full max-w-[440px] items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 transition-colors focus-within:border-foreground/20 focus-within:bg-white focus-within:ring-2 focus-within:ring-foreground/5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="hidden min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed sm:block"
            disabled
          />
          <input
            type="text"
            placeholder="Rechercher compétences, étudiants…"
            className="block min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed sm:hidden"
            disabled
          />
        </label>
      </div>

      {/* Notification bell */}
      {user && (
        <NotificationBell
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
          currentUserId={user.id}
        />
      )}

      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
        SS
      </div>
    </header>
  );
}
