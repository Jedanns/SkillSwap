import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCategory, listCategories } from "@/lib/skills/service";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
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

  try {
    const category = await createCategory(name);
    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    const isUniqueViolation =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (isUniqueViolation) {
      return NextResponse.json({ error: "Cette catégorie existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
