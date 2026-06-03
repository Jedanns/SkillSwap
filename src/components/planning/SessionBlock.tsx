import type { SessionStatus } from "@/generated/prisma/enums";

const GRID_START_MIN = 8 * 60;
const PX_PER_MIN = 64 / 60;

const STATUS_STYLES: Record<SessionStatus, string> = {
  CONFIRMED: "bg-brand-forest text-brand-forest-fg",
  PROPOSED: "bg-brand-lime text-brand-lime-fg",
  IN_PROGRESS: "bg-sky-500 text-white",
  AWAITING_FEEDBACK: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/15 text-destructive",
};

function formatMin(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Props = {
  title: string;
  skillName: string | null;
  tutorName: string | null;
  startMinutes: number;
  durationMinutes: number;
  status: SessionStatus;
  cancelled?: boolean;
};

export function SessionBlock({ title, skillName, tutorName, startMinutes, durationMinutes, status, cancelled }: Props) {
  const top = (startMinutes - GRID_START_MIN) * PX_PER_MIN;
  const height = Math.max(40, durationMinutes * PX_PER_MIN);
  const endMinutes = startMinutes + durationMinutes;

  return (
    <div
      className={`absolute inset-x-1 rounded-lg px-2 py-1.5 overflow-hidden cursor-default select-none ${STATUS_STYLES[status]}`}
      style={{ top, height }}
    >
      <p className={`text-xs font-semibold leading-tight truncate font-heading ${cancelled ? "line-through opacity-60" : ""}`}>
        {title}
      </p>
      {height > 48 && (
        <div className="mt-0.5 space-y-0.5">
          {skillName && (
            <p className="text-[11px] opacity-75 truncate">{skillName}</p>
          )}
          <p className="text-[11px] opacity-60">
            {formatMin(startMinutes)} – {formatMin(endMinutes)}
          </p>
          {tutorName && height > 72 && (
            <p className="text-[11px] opacity-70 truncate">{tutorName}</p>
          )}
        </div>
      )}
    </div>
  );
}
