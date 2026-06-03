import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 });
  }

  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId: id, profileId: user.id } },
    select: { profileId: true },
  });
  if (!member) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  await prisma.conversationParticipant.update({
    where: { conversationId_profileId: { conversationId: id, profileId: user.id } },
    data: { lastReadAt: new Date() },
  });

  return Response.json({ ok: true });
}
