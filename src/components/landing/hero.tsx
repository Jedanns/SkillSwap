import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Pencil,
  Sparkle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO, SCHOOL_DOMAIN } from "@/lib/landing-content";

import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:pb-20 lg:pt-40">
      {/* Subtle dot-grid ornament, top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-24 hidden h-64 w-64 opacity-50 lg:block"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Copy column */}
        <div className="relative flex flex-col items-start">
          {/* Decorative school ornaments around the headline — kept at a distance */}
          <GraduationCap
            aria-hidden
            className="animate-sway pointer-events-none absolute -left-9 -top-12 hidden size-7 text-deep-green/70 lg:block"
          />
          <Sparkles
            aria-hidden
            className="animate-twinkle pointer-events-none absolute -top-8 right-2 hidden size-5 text-peach lg:block"
            style={{ animationDelay: "0.6s" }}
          />
          <ArrowUpRight
            aria-hidden
            className="animate-sway pointer-events-none absolute -left-12 top-1/2 hidden size-6 text-powder lg:block"
            style={{ animationDelay: "1.2s" }}
          />

          <Reveal delay={60}>
            <h1 className="font-heading text-[clamp(2.75rem,7vw,5.5rem)] font-black leading-[0.98] tracking-[-0.035em] text-ink">
              {HERO.title.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-ink sm:text-lg">
              {HERO.subtitle}
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                className="h-12 rounded-full bg-ink px-6 text-base text-surface hover:bg-ink/90"
              >
                <Link href={HERO.primaryCta.href}>
                  {HERO.primaryCta.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-hairline bg-surface px-6 text-base text-ink hover:bg-canvas"
              >
                <a href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-5 font-mono text-xs text-muted-ink">
              Accès réservé aux adresses{" "}
              <span className="text-ink">{SCHOOL_DOMAIN}</span>
            </p>
          </Reveal>
        </div>

        {/* Visual column — hero image with a gentle float */}
        <Reveal delay={160} className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-2xl">
          {/* Ornaments floating around the image, in its faded edges */}
          <Sparkle
            aria-hidden
            className="animate-twinkle pointer-events-none absolute right-4 top-2 z-10 size-6 text-peach"
          />
          <GraduationCap
            aria-hidden
            className="animate-sway pointer-events-none absolute bottom-6 left-0 z-10 size-7 text-deep-green/70"
            style={{ animationDelay: "0.9s" }}
          />
          <Pencil
            aria-hidden
            className="animate-sway pointer-events-none absolute right-6 bottom-10 z-10 size-5 text-powder"
            style={{ animationDelay: "1.6s" }}
          />
          <Sparkles
            aria-hidden
            className="animate-twinkle pointer-events-none absolute left-6 top-6 z-10 size-5 text-deep-green/60"
            style={{ animationDelay: "0.3s" }}
          />

          <div className="animate-float">
            <Image
              src="/Firstimage.png"
              alt=""
              width={1448}
              height={1086}
              priority
              className="h-auto w-full rounded-[58%_42%_55%_45%/52%_48%_56%_44%]"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 70% 68% at 50% 47%, #000 38%, rgba(0,0,0,0.6) 58%, transparent 76%)",
                maskImage:
                  "radial-gradient(ellipse 70% 68% at 50% 47%, #000 38%, rgba(0,0,0,0.6) 58%, transparent 76%)",
              }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
