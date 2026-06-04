import { NextRequest, NextResponse } from "next/server";
import { searchSkills } from "@/lib/skills/service";
import { searchProfiles } from "@/lib/profiles/service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!q || q.length < 2) {
    return NextResponse.json({ skills: [], users: [], totals: { skills: 0, users: 0 } });
  }

  const [allSkills, allUsers] = await Promise.all([
    searchSkills(q),
    searchProfiles(q, 50),
  ]);

  return NextResponse.json({
    skills: allSkills.slice(0, limit),
    users: allUsers.slice(0, limit),
    totals: { skills: allSkills.length, users: allUsers.length },
  });
}
