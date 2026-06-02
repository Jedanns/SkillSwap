"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/landing-content";

import { Wordmark } from "./wordmark";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Tighten the frosted capsule once the user scrolls past the hero top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav
        aria-label="Navigation principale"
        className={cn(
          "mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-hairline px-4 py-2.5 backdrop-blur-md transition-all duration-300 sm:px-5",
          scrolled
            ? "bg-surface/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            : "bg-surface/60",
        )}
      >
        <Link
          href="/"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          aria-label="SkillSwap, accueil"
        >
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-ink transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            asChild
            variant="ghost"
            className="h-9 rounded-full px-4 text-sm text-ink hover:bg-canvas"
          >
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-full bg-ink px-4 text-sm text-surface hover:bg-ink/90"
          >
            <Link href="/signup">Créer un compte</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex size-9 items-center justify-center rounded-full border border-hairline bg-surface text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile sheet */}
      {open ? (
        <div
          id="mobile-menu"
          className="mx-auto mt-2 max-w-5xl rounded-[28px] border border-hairline bg-surface/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.10)] backdrop-blur-md md:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-medium text-ink transition-colors hover:bg-canvas"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
            <Button
              asChild
              variant="ghost"
              className="h-11 rounded-full text-base text-ink hover:bg-canvas"
            >
              <Link href="/login" onClick={() => setOpen(false)}>
                Se connecter
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-full bg-ink text-base text-surface hover:bg-ink/90"
            >
              <Link href="/signup" onClick={() => setOpen(false)}>
                Créer un compte
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
