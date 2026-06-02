"use client";

import { useRef, useState } from "react";
import type { Task } from "@/lib/store";

type Props = {
  task: Task;
  mode: "open" | "done";
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onPushTomorrow: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, dueDate: string) => void;
};

export function TaskRow({
  task,
  mode,
  onComplete,
  onUncomplete,
  onPushTomorrow,
  onDelete,
  onReschedule,
}: Props) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const [showDate, setShowDate] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if (mode !== "open") return;
    startX.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (mode !== "open" || startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    setDragX(Math.max(-120, Math.min(160, dx)));
  }
  function onTouchEnd() {
    if (mode !== "open") return;
    if (dragX > 90) onPushTomorrow(task.id);
    else if (dragX < -80) onDelete(task.id);
    setDragX(0);
    startX.current = null;
  }

  return (
    <div className="relative overflow-hidden">
      {mode === "open" && (
        <div className="absolute inset-0 flex items-center justify-between px-5 text-sm font-medium">
          <span className={dragX > 30 ? "text-accent" : "text-muted/40"}>
            → Tomorrow
          </span>
          <span className={dragX < -30 ? "text-red-500" : "text-muted/40"}>
            Delete
          </span>
        </div>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: startX.current === null ? "transform 200ms" : "none",
        }}
        className="flex items-center gap-3 border-b border-border bg-card px-4 py-3"
      >
        <button
          aria-label={mode === "open" ? "Complete" : "Restore"}
          onClick={() =>
            mode === "open" ? onComplete(task.id) : onUncomplete(task.id)
          }
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
            mode === "done"
              ? "border-accent bg-accent text-white"
              : "border-border"
          }`}
        >
          {mode === "done" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l5 5L20 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <button
          onClick={() => mode === "open" && setShowDate(true)}
          className={`min-w-0 flex-1 truncate text-left text-base ${
            mode === "done" ? "text-muted line-through" : ""
          }`}
        >
          {task.text}
        </button>
      </div>

      {showDate && (
        <DatePicker
          value={task.due_date}
          onClose={() => setShowDate(false)}
          onPick={(d) => {
            onReschedule(task.id, d);
            setShowDate(false);
          }}
        />
      )}
    </div>
  );
}

function DatePicker({
  value,
  onClose,
  onPick,
}: {
  value: string;
  onClose: () => void;
  onPick: (d: string) => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end bg-black/40"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-md rounded-t-2xl border-t border-border bg-card p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <p className="mb-3 text-sm font-medium text-muted">Reschedule</p>
        <input
          type="date"
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base"
          >
            Cancel
          </button>
          <button
            onClick={() => onPick(v)}
            className="flex-1 rounded-xl bg-accent px-4 py-3 text-base font-medium text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
