import {
  Activity,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  GraduationCap,
  type LucideIcon,
  MessagesSquare,
  Newspaper,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

/**
 * Maps the string `icon` names used in landing-content.ts to lucide
 * components, so the data file stays free of JSX/imports.
 */
export const ICONS: Record<string, LucideIcon> = {
  Activity,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  GraduationCap,
  MessagesSquare,
  Newspaper,
  Search,
  Sparkles,
  Star,
  Users,
};
