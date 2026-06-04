import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { participantSelect } from "@/lib/messages/serialize";
import { serializeNotification } from "@/lib/notifications/serialize";

const LIMIT = 25;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const rows = await prisma.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    include: { actor: { select: participantSelect } },
  });

  const unreadCount = rows.filter((n) => !n.isRead).length;
  const notifications = rows.map(serializeNotification);

  return Response.json({ notifications, unreadCount });
}
