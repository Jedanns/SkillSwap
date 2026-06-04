import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { participantSelect } from "@/lib/messages/serialize";

const LIMIT = 20;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const rows = await prisma.notification.findMany({
    where: { recipientId: user.id, type: "MESSAGE_RECEIVED" },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    include: { actor: { select: participantSelect } },
  });

  const unreadCount = rows.filter((n) => !n.isRead).length;

  const notifications = rows.map((n) => {
    const preview =
      n.data && typeof n.data === "object" && !Array.isArray(n.data)
        ? (n.data as Record<string, unknown>).messagePreview
        : undefined;

    return {
      id: n.id,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      conversationId: n.entityId ?? null,
      messagePreview: typeof preview === "string" ? preview : null,
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
    };
  });

  return Response.json({ notifications, unreadCount });
}
