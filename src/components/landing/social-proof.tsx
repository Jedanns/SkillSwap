import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { SKILLS_MARQUEE, TESTIMONIALS } from "@/lib/landing-content";

import { SectionHeading } from "./section-heading";

const AVATAR: Record<string, string> = {
  pistache: "bg-pistache text-deep-green",
  powder: "bg-powder text-deep-green",
  peach: "bg-peach/25 text-peach",
  "deep-green": "bg-deep-green text-pistache",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} sur 5 étoiles`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating ? "fill-peach text-peach" : "text-hairline",
          )}
        />
      ))}
    </div>
  );
}

export function SocialProof() {
  // Duplicate lists so the -50% translate loops seamlessly.
  const skills = [...SKILLS_MARQUEE, ...SKILLS_MARQUEE];
  const testimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section
      id="temoignages"
      className="overflow-hidden px-4 py-[clamp(72px,11vw,140px)] sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Ils apprennent déjà ensemble"
          title="La preuve par le campus"
          kicker="Rejoint par les promos B3 Dev, B2 Cyber et B1 Design 2025–2026."
        />
      </div>

      {/* Skills marquee */}
      <div className="marquee-group relative mt-12 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max shrink-0 animate-marquee gap-3 pr-3">
          {skills.map((skill, i) => (
            <span
              key={`${skill}-${i}`}
              className="whitespace-nowrap rounded-full border border-hairline bg-surface px-5 py-2.5 font-mono text-sm text-ink"
              aria-hidden={i >= SKILLS_MARQUEE.length ? true : undefined}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Testimonials marquee */}
      <div className="marquee-group relative mt-6 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul className="flex w-max shrink-0 animate-marquee gap-5 pr-5">
          {testimonials.map((t, i) => (
            <li
              key={`${t.name}-${i}`}
              aria-hidden={i >= TESTIMONIALS.length ? true : undefined}
              className="flex w-[min(85vw,360px)] shrink-0 flex-col rounded-[28px] border border-hairline bg-surface p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
            >
              <Stars rating={t.rating} />
              <p className="mt-4 flex-1 text-base leading-relaxed text-ink">
                “{t.quote}”
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full font-heading text-sm font-bold",
                    AVATAR[t.accent] ?? "bg-canvas text-ink",
                  )}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted-ink">{t.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
