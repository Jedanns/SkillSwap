import { FEATURE_ROWS } from "@/lib/landing-content";

import { FeatureRow } from "./feature-row";
import { SectionHeading } from "./section-heading";

export function FeatureRows() {
  return (
    <section
      id="competences"
      className="bg-surface px-4 py-[clamp(72px,11vw,140px)] sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Le parcours"
          title="De la recherche à la certification"
          kicker="Quatre étapes pour transformer une demande d’aide en compétence reconnue sur le campus."
        />

        <div className="mt-12 flex flex-col gap-16 sm:mt-16 md:gap-28">
          {FEATURE_ROWS.map((row) => (
            <FeatureRow key={row.id} {...row} />
          ))}
        </div>
      </div>
    </section>
  );
}
