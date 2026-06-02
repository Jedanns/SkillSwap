import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PROGRESSION_TIERS, PROGRESSION_TRACKS } from "@/lib/landing-content";

import { ICONS } from "./icons";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Progression() {
  return (
    <section
      id="progression"
      className="bg-surface px-4 py-[clamp(72px,11vw,140px)] sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Gamification"
          title="La crédibilité se construit, niveau par niveau"
          kicker="Trois axes de progression nourrissent ta réputation. Aucune offre payante : SkillSwap est gratuit et réservé au campus."
        />

        {/* Three XP tracks */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {PROGRESSION_TRACKS.map((track, i) => {
            const Icon = ICONS[track.icon];
            return (
              <Reveal
                key={track.title}
                delay={i * 70}
                className="rounded-[24px] border border-hairline bg-canvas p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-surface text-deep-green shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  {Icon ? <Icon className="size-5" /> : null}
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-ink">
                  {track.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-ink">
                  {track.body}
                </p>
              </Reveal>
            );
          })}
        </div>

        {/* Skill tiers */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {PROGRESSION_TIERS.map((tier, i) => {
            const featured = tier.highlighted;
            return (
              <Reveal
                key={tier.id}
                delay={i * 80}
                className={cn(
                  "flex flex-col rounded-[28px] border p-7",
                  featured
                    ? "border-transparent bg-deep-green text-surface shadow-[0_24px_60px_rgba(36,79,67,0.28)] lg:-mt-4 lg:mb-4"
                    : "border-hairline bg-canvas text-ink",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "font-mono text-xs uppercase tracking-[0.14em]",
                      featured ? "text-pistache" : "text-muted-ink",
                    )}
                  >
                    {tier.level}
                  </span>
                  {featured ? (
                    <span className="rounded-full bg-pistache px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-deep-green">
                      Certifiée
                    </span>
                  ) : null}
                </div>

                <h3
                  className={cn(
                    "mt-4 font-heading text-3xl font-black tracking-[-0.02em]",
                    featured ? "text-surface" : "text-ink",
                  )}
                >
                  {tier.name}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    featured ? "text-surface/75" : "text-muted-ink",
                  )}
                >
                  {tier.tagline}
                </p>

                <p
                  className={cn(
                    "mt-5 font-heading text-lg font-bold",
                    featured ? "text-pistache" : "text-deep-green",
                  )}
                >
                  Gratuit
                  <span
                    className={cn(
                      "ml-2 font-sans text-xs font-normal",
                      featured ? "text-surface/60" : "text-muted-ink",
                    )}
                  >
                    réservé au campus
                  </span>
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                          featured
                            ? "bg-pistache text-deep-green"
                            : "bg-deep-green text-pistache",
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span
                        className={featured ? "text-surface/90" : "text-ink"}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-7 h-11 rounded-full text-sm",
                    featured
                      ? "bg-pistache text-deep-green hover:bg-pistache/90"
                      : "bg-ink text-surface hover:bg-ink/90",
                  )}
                >
                  <Link href="/signup">Rejoindre SkillSwap</Link>
                </Button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
