import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
        <div className="flex flex-col items-start">
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
