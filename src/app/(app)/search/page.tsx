import { BookOpen, GraduationCap, Layers, ShieldCheck, Star, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { searchProfiles } from "@/lib/profiles/service";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchSkills(q: string) {
  return prisma.skill.findMany({
    where: {
      isDormant: false,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { canonicalDescription: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      category: true,
      createdBy: {
        select: { id: true, firstName: true, lastName: true, username: true, displayName: true, avatarUrl: true },
      },
      _count: { select: { holders: true, sessions: true, notions: true } },
    },
    orderBy: [{ heatScore: "desc" }, { name: "asc" }],
    take: 50,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

const AVATAR_COLORS = [
  "bg-pistache/40 text-deep-green",
  "bg-powder text-deep-green",
  "bg-peach/20 text-orange-800",
];

function profileDisplayName(p: Profile) {
  if (p.displayName) return p.displayName;
  if (p.firstName || p.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return p.username ?? "—";
}

function profileInitials(p: Profile) {
  return profileDisplayName(p).slice(0, 1).toUpperCase();
}

function avatarColor(id: string) {
  return AVATAR_COLORS[(id.charCodeAt(0) + (id.charCodeAt(1) ?? 0)) % AVATAR_COLORS.length];
}

// ─── Skill Card ───────────────────────────────────────────────────────────────

type SkillData = Awaited<ReturnType<typeof fetchSkills>>[number];

function SkillCard({ skill }: { skill: SkillData }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {skill.category && (
            <span className="rounded-full bg-powder/60 px-2 py-0.5 text-[11px] font-medium text-deep-green">
              {skill.category.name}
            </span>
          )}
          {skill.isCertified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pistache/20 px-2 py-0.5 text-[11px] font-semibold text-deep-green">
              <ShieldCheck className="h-3 w-3" />
              Certifiée
            </span>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg font-bold leading-tight text-ink">{skill.name}</h3>
        {skill.canonicalDescription && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-ink">
            {skill.canonicalDescription}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-ink">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {skill._count.holders} détenteur{skill._count.holders !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5" />
          {skill._count.sessions} séance{skill._count.sessions !== 1 ? "s" : ""}
        </span>
        {skill._count.notions > 0 && (
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {skill._count.notions} notion{skill._count.notions !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-hairline pt-3">
        {skill.createdBy.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={skill.createdBy.avatarUrl}
            alt={profileDisplayName(skill.createdBy)}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-black/10"
          />
        ) : (
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-black/10 ${avatarColor(skill.createdBy.id)}`}>
            {profileInitials(skill.createdBy)}
          </div>
        )}
        <span className="text-xs text-muted-ink">
          par{" "}
          <span className="font-medium text-ink">{profileDisplayName(skill.createdBy)}</span>
        </span>
      </div>
    </article>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────

type UserData = Awaited<ReturnType<typeof searchProfiles>>[number];

function UserCard({ user }: { user: UserData }) {
  const name = profileDisplayName(user);
  const rating = user.tutorRatingAvg ? parseFloat(String(user.tutorRatingAvg)) : null;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-start gap-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={name}
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-black/10"
          />
        ) : (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-1 ring-black/10 ${avatarColor(user.id)}`}>
            {profileInitials(user)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-bold text-ink">{name}</p>
          {user.username && (
            <p className="text-xs text-muted-ink">@{user.username}</p>
          )}
          {user.headline && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-ink">
              {user.headline}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full border border-hairline bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted-ink">
          Niv. {user.accountLevel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline pt-3 text-xs text-muted-ink">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {user._count.skills} compétence{user._count.skills !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5" />
          {user.sessionsTaught} séance{user.sessionsTaught !== 1 ? "s" : ""} enseignée{user.sessionsTaught !== 1 ? "s" : ""}
        </span>
        {rating !== null && (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [skills, users] = query.length >= 2
    ? await Promise.all([fetchSkills(query), searchProfiles(query)])
    : [[], []];

  const total = skills.length + users.length;

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <div className="border-b border-hairline bg-surface px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-1 font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">
            Recherche
          </p>
          {query ? (
            <>
              <h1 className="font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">
                «&nbsp;{query}&nbsp;»
              </h1>
              <p className="mt-2 text-sm text-muted-ink">
                {total === 0
                  ? "Aucun résultat trouvé"
                  : `${total} résultat${total !== 1 ? "s" : ""} — ${skills.length} compétence${skills.length !== 1 ? "s" : ""}, ${users.length} utilisateur${users.length !== 1 ? "s" : ""}`}
              </p>
            </>
          ) : (
            <h1 className="font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Rechercher
            </h1>
          )}
        </div>
      </div>

      {!query ? (
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-8">
          <p className="text-sm text-muted-ink">Tape quelque chose dans la barre de recherche pour commencer.</p>
        </div>
      ) : total === 0 ? (
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-8">
          <p className="font-semibold text-zinc-400">Aucun résultat pour « {query} »</p>
          <p className="mt-1 text-sm text-zinc-300">Essaie un autre mot-clé.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-8">
          {skills.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-black text-ink">
                Compétences
                <span className="ml-2 font-sans text-sm font-normal text-muted-ink">
                  {skills.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            </section>
          )}

          {users.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-black text-ink">
                Utilisateurs
                <span className="ml-2 font-sans text-sm font-normal text-muted-ink">
                  {users.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
