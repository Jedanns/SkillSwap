import { BENTO_CARDS } from "@/lib/landing-content";

import { BentoCard } from "./bento-card";
import { SectionHeading } from "./section-heading";

export function BentoGrid() {
  return (
    <section
      id="fonctionnalites"
      className="px-4 py-[clamp(72px,11vw,140px)] sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Tout au même endroit"
          title={
            <>
              Une plateforme pensée pour
              <br className="hidden sm:block" /> apprendre entre pairs
            </>
          }
          kicker="Recherche, échange, sessions et suivi : chaque brique du parcours étudiant réunie dans une interface claire."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:auto-rows-[minmax(190px,auto)]">
          {BENTO_CARDS.map((card, i) => (
            <BentoCard key={card.id} index={i} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
