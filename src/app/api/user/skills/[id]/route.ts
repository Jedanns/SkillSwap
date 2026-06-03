import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { removeUserSkill } from "@/lib/skills/service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const result = await removeUserSkill(user.id, id);

  if (!result) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
