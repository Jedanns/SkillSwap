import { Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-sm">
      {/* Search — shrinks gracefully */}
      <div className="flex flex-1 justify-center">
        <label className="flex w-full max-w-[440px] items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 transition-colors focus-within:border-foreground/20 focus-within:bg-white focus-within:ring-2 focus-within:ring-foreground/5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="hidden min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed sm:block"
            disabled
          />
          {/* Mobile: show full placeholder on ≥sm, abbreviate on smaller */}
          <input
            type="text"
            placeholder="Rechercher compétences, étudiants…"
            className="block min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed sm:hidden"
            disabled
          />
        </label>
      </div>

      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
        SS
      </div>
    </header>
  );
}
