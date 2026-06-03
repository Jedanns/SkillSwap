import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSkill, searchSkills } from "@/lib/skills/service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const skills = await searchSkills(query, categoryId);
  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  }

  const notions = Array.isArray(body?.notions)
    ? body.notions.filter(
        (n: unknown) => typeof n === "object" && n !== null && typeof (n as { title?: unknown }).title === "string",
      )
    : undefined;

  try {
    const skill = await createSkill({
      name,
      description: typeof body?.description === "string" ? body.description : undefined,
      categoryId: typeof body?.categoryId === "string" ? body.categoryId : undefined,
      createdById: user.id,
      notions,
    });
    return NextResponse.json(skill, { status: 201 });
  } catch (err: unknown) {
    const isUniqueViolation =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (isUniqueViolation) {
      return NextResponse.json({ error: "Un skill avec ce nom existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
