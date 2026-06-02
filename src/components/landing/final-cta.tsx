import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FINAL_CTA } from "@/lib/landing-content";

import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="px-4 py-[clamp(48px,8vw,96px)] sm:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-deep-green px-6 py-16 text-center sm:px-12 sm:py-24">
        {/* Pastel ornaments */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full bg-pistache/20 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-8 size-56 rounded-full bg-peach/20 blur-2xl"
        />
        <span
          aria-hidden
          className="absolute right-10 top-10 hidden font-heading text-6xl text-pistache/40 sm:block"
        >
          ✳
        </span>

        <div className="relative">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-pistache">
            {FINAL_CTA.eyebrow}
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-surface">
            {FINAL_CTA.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-surface/75 sm:text-lg">
            {FINAL_CTA.body}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-full bg-pistache px-6 text-base text-deep-green hover:bg-pistache/90"
            >
              <Link href={FINAL_CTA.primaryCta.href}>
                {FINAL_CTA.primaryCta.label}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-surface/25 bg-transparent px-6 text-base text-surface hover:bg-surface/10 hover:text-surface"
            >
              <Link href={FINAL_CTA.secondaryCta.href}>
                {FINAL_CTA.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
