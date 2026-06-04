"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionBlock } from "./SessionBlock";
import type { SessionStatus, SessionKind } from "@/generated/prisma/enums";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8h → 21h
const PX_PER_HOUR = 64;
const GRID_HEIGHT = 14 * PX_PER_HOUR; // 896px

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = [
  "jan.", "fév.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export type PlanningSession = {
  id: string;
  title: string;
  scheduledAt: string;
  duration_minutes: number;
  status: SessionStatus;
  kind: SessionKind;
  skillName: string | null;
  tutorName: string | null;
};

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Props = {
  sessions: PlanningSession[];
  weekStart: string; // "YYYY-MM-DD"
};

export function WeekCalendar({ sessions, weekStart }: Props) {
  const router = useRouter();

  const start = new Date(weekStart + "T00:00:00");
  const today = new Date();
  const currentMonday = getMondayOfWeek(today);
  const isCurrentWeek = toDateParam(start) === toDateParam(currentMonday);

  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const endDay = days[6];

  const rangeLabel = `${start.getDate()} – ${endDay.getDate()} ${MONTH_NAMES[endDay.getMonth()]} ${endDay.getFullYear()}`;
  const navigate = (date: Date) => router.push(`/planning?week=${toDateParam(date)}`);

  const sessionsByDay = days.map((day) =>
    sessions.filter((s) => isSameDay(new Date(s.scheduledAt), day))
  );

  // Mobile: selected day index within the week
  const defaultDayIndex = () => {
    const idx = days.findIndex((d) => isSameDay(d, today));
    return idx >= 0 ? idx : 0;
  };
  const [selectedDayIndex, setSelectedDayIndex] = useState(defaultDayIndex);

  // Reset selected day when week changes
  useEffect(() => {
    const newDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStart + "T00:00:00"), i));
    const idx = newDays.findIndex((d) => isSameDay(d, new Date()));
    setSelectedDayIndex(idx >= 0 ? idx : 0);
  }, [weekStart]);

  // Shared column renderer used by both mobile and desktop grids
  const renderColumns = (indices: number[]) => (
    <div
      className="grid"
      style={{ gridTemplateColumns: `3rem repeat(${indices.length}, minmax(0, 1fr))` }}
    >
      {/* Time axis */}
      <div className="relative shrink-0" style={{ height: GRID_HEIGHT }}>
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute right-2 text-[10px] text-muted-foreground tabular-nums leading-none"
            style={{ top: (h - 8) * PX_PER_HOUR - 5 }}
          >
            {h}h
          </div>
        ))}
      </div>

      {indices.map((di) => (
        <div
          key={di}
          className="relative border-l border-border"
          style={{ height: GRID_HEIGHT }}
        >
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-border/40"
              style={{ top: (h - 8) * PX_PER_HOUR }}
            />
          ))}
          {HOURS.map((h) => (
            <div
              key={`${h}-half`}
              className="absolute inset-x-0 border-t border-border/20 border-dashed"
              style={{ top: (h - 8) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
            />
          ))}
          {sessionsByDay[di].map((s) => {
            const d = new Date(s.scheduledAt);
            const startMinutes = d.getHours() * 60 + d.getMinutes();
            return (
              <SessionBlock
                key={s.id}
                id={s.id}
                title={s.title}
                skillName={s.skillName}
                tutorName={s.tutorName}
                startMinutes={startMinutes}
                durationMinutes={s.duration_minutes}
                status={s.status}
                cancelled={s.status === "CANCELLED"}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Week navigation — same on all breakpoints */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(addDays(start, -7))}
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(addDays(start, 7))}
          aria-label="Semaine suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium px-1 tabular-nums">{rangeLabel}</span>
        {!isCurrentWeek && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 text-xs"
            onClick={() => navigate(currentMonday)}
          >
            Aujourd&apos;hui
          </Button>
        )}
      </div>

      {/* ── MOBILE: day strip + single-column grid ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Day pill strip */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isSelected = i === selectedDayIndex;
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIndex(i)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 transition-colors ${
                  isSelected
                    ? "bg-brand-forest text-brand-forest-fg"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                <span className="text-[9px] uppercase tracking-widest font-medium opacity-70">
                  {DAY_NAMES[i]}
                </span>
                <span
                  className={`text-sm font-semibold leading-none ${
                    isToday && !isSelected ? "text-brand-forest" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                {/* Today dot */}
                <span
                  className={`w-1 h-1 rounded-full transition-opacity ${
                    isToday
                      ? isSelected
                        ? "bg-brand-forest-fg/50 opacity-100"
                        : "bg-brand-forest opacity-100"
                      : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Single-day time grid */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div
            className="grid border-b border-border"
            style={{ gridTemplateColumns: "3rem 1fr" }}
          >
            <div />
            <div className="h-12 flex flex-col items-center justify-center border-l border-border">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {DAY_NAMES[selectedDayIndex]}
              </span>
              <span
                className={`text-sm font-semibold mt-0.5 leading-none w-6 h-6 flex items-center justify-center rounded-full ${
                  isSameDay(days[selectedDayIndex], today)
                    ? "bg-brand-forest text-brand-forest-fg"
                    : "text-foreground"
                }`}
              >
                {days[selectedDayIndex].getDate()}
              </span>
            </div>
          </div>
          {renderColumns([selectedDayIndex])}
        </div>
      </div>

      {/* ── DESKTOP: 7-column week grid ── */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: "3rem repeat(7, minmax(80px, 1fr))" }}
        >
          <div />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className="h-12 flex flex-col items-center justify-center border-l border-border"
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {DAY_NAMES[i]}
                </span>
                <span
                  className={`text-sm font-semibold mt-0.5 leading-none w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-brand-forest text-brand-forest-fg"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        {renderColumns([0, 1, 2, 3, 4, 5, 6])}
      </div>
    </div>
  );
}
