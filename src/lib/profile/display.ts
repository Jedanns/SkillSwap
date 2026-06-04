type NameParts = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

/** Canonical way to render a profile's name across the app. */
export function profileDisplayName(p: NameParts): string {
  if (p.displayName) return p.displayName;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return p.username ?? "Étudiant";
}

export function profileInitials(p: NameParts): string {
  return profileDisplayName(p).slice(0, 2).toUpperCase();
}
