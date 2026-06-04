import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { participantSelect } from "@/lib/messages/serialize";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { AvatarMenu } from "./AvatarMenu";
import { serializeNotification } from "@/lib/notifications/serialize";

const NOTIF_LIMIT = 25;

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rows, profile] = user
    ? await Promise.all([
        prisma.notification.findMany({
          where: { recipientId: user.id },
          orderBy: { createdAt: "desc" },
          take: NOTIF_LIMIT,
          include: { actor: { select: participantSelect } },
        }),
        prisma.profile.findUnique({
          where: { id: user.id },
          select: { username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true },
        }),
      ])
    : [[], null];

  const unreadCount = rows.filter((n) => !n.isRead).length;
  const notifications = rows.map(serializeNotification);

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-sm">
      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      {user && (
        <NotificationBell
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
          currentUserId={user.id}
        />
      )}

      {profile ? (
        <AvatarMenu profile={profile} />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">SS</div>
      )}
    </header>
  );
}
