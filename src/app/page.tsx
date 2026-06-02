"use client";

import { useTasks, type Task } from "@/lib/store";
import { todayISO, addDaysISO, prettyDay } from "@/lib/date";
import { DaySection } from "@/components/DaySection";
import { DayNote } from "@/components/DayNote";
import { BottomNav } from "@/components/BottomNav";

const VISIBLE_DAYS = 7;

export default function TodayPage() {
  const {
    tasks,
    notes,
    hydrated,
    add,
    complete,
    uncomplete,
    reschedule,
    updateText,
    pushToTomorrow,
    remove,
    reorder,
    setNote,
  } = useTasks();

  const today = todayISO();
  const open = tasks
    .filter((t) => !t.completed_at)
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.created_at.localeCompare(b.created_at),
    );

  const horizonEnd = addDaysISO(today, VISIBLE_DAYS - 1);
  const days: { date: string; label: string }[] = [];
  for (let i = 0; i < VISIBLE_DAYS; i++) {
    const d = addDaysISO(today, i);
    days.push({ date: d, label: prettyDay(d) });
  }

  const byDay = new Map<string, Task[]>();
  for (const t of open) {
    const key = t.due_date <= today ? today : t.due_date;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }

  const later: Task[] = [];
  const laterByDay = new Map<string, Task[]>();
  for (const t of open) {
    if (t.due_date > horizonEnd) {
      later.push(t);
      if (!laterByDay.has(t.due_date)) laterByDay.set(t.due_date, []);
      laterByDay.get(t.due_date)!.push(t);
    }
  }

  const totalOpen = open.length;

  return (
    <main className="mx-auto max-w-md">
      <header className="px-5 pb-2 pt-8">
        <p className="text-sm text-muted">{prettyDay(today)}</p>
        <h1 className="text-3xl font-semibold">
          {!hydrated ? " " : totalOpen === 0 ? "All clear." : `${totalOpen} open`}
        </h1>
      </header>

      <div className="px-5 pb-2 pt-3">
        <DayNote day={today} value={notes[today] ?? ""} onChange={setNote} />
      </div>

      {days.map((d) => (
        <DaySection
          key={d.date}
          label={d.label}
          dueDate={d.date}
          tasks={byDay.get(d.date) ?? []}
          onAdd={add}
          onComplete={complete}
          onUncomplete={uncomplete}
          onPushTomorrow={pushToTomorrow}
          onDelete={remove}
          onReschedule={reschedule}
          onUpdateText={updateText}
          onReorder={reorder}
          hideEmpty={d.date !== today && d.date !== addDaysISO(today, 1)}
        />
      ))}

      {later.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-border px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Later
            <span className="ml-2 text-muted/70">{later.length}</span>
          </h2>
          {Array.from(laterByDay.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, items]) => (
              <DaySection
                key={day}
                label={prettyDay(day)}
                dueDate={day}
                tasks={items}
                onAdd={add}
                onComplete={complete}
                onUncomplete={uncomplete}
                onPushTomorrow={pushToTomorrow}
                onDelete={remove}
                onReschedule={reschedule}
                onUpdateText={updateText}
                onReorder={reorder}
              />
            ))}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
