import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PATCH() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { recipientId: user.id, type: "MESSAGE_RECEIVED", isRead: false },
    data: { isRead: true },
  });

  return Response.json({ ok: true });
}
