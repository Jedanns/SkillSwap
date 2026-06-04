import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Lightweight identity for client components that need the signed-in user. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ profile: profile ?? { id: user.id } });
}
