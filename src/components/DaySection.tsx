"use client";

import { useRef, useState } from "react";
import type { Task } from "@/lib/store";
import { TaskRow } from "./TaskRow";

type Props = {
  label: string;
  dueDate: string;
  tasks: Task[];
  onAdd: (text: string, dueDate?: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onPushTomorrow: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, dueDate: string) => void;
  onUpdateText: (id: string, text: string) => void;
  hideEmpty?: boolean;
};

export function DaySection({
  label,
  dueDate,
  tasks,
  onAdd,
  onComplete,
  onUncomplete,
  onPushTomorrow,
  onDelete,
  onReschedule,
  onUpdateText,
  hideEmpty,
}: Props) {
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (hideEmpty && tasks.length === 0 && !composing) return null;

  function submit() {
    const v = text.trim();
    if (!v) return;
    onAdd(v, dueDate);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between border-b border-border px-5 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
          {tasks.length > 0 && (
            <span className="ml-2 text-muted/70">{tasks.length}</span>
          )}
        </h2>
        <button
          onClick={() => {
            setComposing(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          aria-label={`Add task to ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-muted active:bg-border"
        >
          +
        </button>
      </div>

      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow
              task={t}
              mode="open"
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onPushTomorrow={onPushTomorrow}
              onDelete={onDelete}
              onReschedule={onReschedule}
              onUpdateText={onUpdateText}
            />
          </li>
        ))}
      </ul>

      {composing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 border-b border-border bg-card px-4 py-2"
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              setTimeout(() => {
                if (!text.trim()) setComposing(false);
              }, 150);
            }}
            placeholder={`Add to ${label.toLowerCase()}…`}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Add
          </button>
        </form>
      )}

      {tasks.length === 0 && !composing && (
        <p className="px-5 py-4 text-sm text-muted/70">No tasks</p>
      )}
    </section>
  );
}
