import { FOOTER_GROUPS, SCHOOL_DOMAIN } from "@/lib/landing-content";

import { Wordmark } from "./wordmark";

export function Footer() {
  return (
    <footer className="bg-ink px-4 pb-10 pt-16 text-surface sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand column — full width on mobile, first column on desktop */}
          <div className="col-span-2 max-w-xs md:col-span-1">
            <Wordmark className="h-11" />
            <p className="mt-4 text-sm leading-relaxed text-surface/60">
              Le tutorat entre pairs du campus DSP F2I. Apprends, enseigne et
              fais certifier tes compétences, entre étudiants.
            </p>
            <p className="mt-4 font-mono text-xs text-surface/50">
              {SCHOOL_DOMAIN}
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-surface/50">
                {group.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-surface/75 transition-colors hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/40 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-surface/10 pt-6 text-xs text-surface/50 sm:flex-row sm:items-center">
          <p>© 2026 SkillSwap · DSP F2I. Projet étudiant.</p>
          <p className="font-mono">Fait avec ✳ sur le campus.</p>
        </div>
      </div>
    </footer>
  );
}
