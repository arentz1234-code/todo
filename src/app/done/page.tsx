"use client";

import { useTasks, type Task } from "@/lib/store";
import { prettyDay } from "@/lib/date";
import { TaskRow } from "@/components/TaskRow";
import { DayNote } from "@/components/DayNote";
import { BottomNav } from "@/components/BottomNav";

export default function DonePage() {
  const {
    tasks,
    notes,
    hydrated,
    complete,
    uncomplete,
    reschedule,
    updateText,
    pushToTomorrow,
    remove,
    setNote,
  } = useTasks();

  const done = tasks
    .filter((t) => t.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  const groups = new Map<string, Task[]>();
  for (const t of done) {
    const day = (t.completed_at ?? "").slice(0, 10);
    if (!day) continue;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(t);
  }
  for (const day of Object.keys(notes)) {
    if (!groups.has(day) && (notes[day] ?? "").trim().length > 0) {
      groups.set(day, []);
    }
  }
  const sortedDays = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <main className="mx-auto max-w-md">
      <header className="px-5 pb-3 pt-8">
        <p className="text-sm text-muted">History</p>
        <h1 className="text-3xl font-semibold">Done</h1>
      </header>

      {hydrated && sortedDays.length === 0 ? (
        <p className="px-5 py-12 text-center text-muted">
          Nothing yet.
        </p>
      ) : (
        sortedDays.map((day) => {
          const items = groups.get(day) ?? [];
          const note = notes[day] ?? "";
          return (
            <section key={day} className="mt-4">
              <h2 className="border-b border-border bg-bg px-5 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                {prettyDay(day)}
                {items.length > 0 && ` · ${items.length}`}
              </h2>
              {(note.length > 0 || items.length === 0) && (
                <div className="border-b border-border px-5 py-3">
                  <DayNote
                    day={day}
                    value={note}
                    onChange={setNote}
                    placeholder="Add a note for this day…"
                    compact
                  />
                </div>
              )}
              <ul>
                {items.map((t) => (
                  <li key={t.id}>
                    <TaskRow
                      task={t}
                      mode="done"
                      onComplete={complete}
                      onUncomplete={uncomplete}
                      onPushTomorrow={pushToTomorrow}
                      onDelete={remove}
                      onReschedule={reschedule}
                      onUpdateText={updateText}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <BottomNav />
    </main>
  );
}
