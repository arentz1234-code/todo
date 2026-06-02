"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/store";

type Props = {
  task: Task;
  mode: "open" | "done";
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onPushTomorrow: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, dueDate: string) => void;
  onUpdateText: (id: string, text: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
};

export function TaskRow({
  task,
  mode,
  onComplete,
  onUncomplete,
  onPushTomorrow,
  onDelete,
  onReschedule,
  onUpdateText,
  dragHandleProps,
  isDragging,
}: Props) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const [editing, setEditing] = useState(false);

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
        className={`flex items-center gap-3 border-b border-border bg-card px-4 py-3 ${
          isDragging ? "opacity-50 shadow-lg" : ""
        }`}
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
          onClick={() => setEditing(true)}
          className={`min-w-0 flex-1 truncate text-left text-base ${
            mode === "done" ? "text-muted line-through" : ""
          }`}
        >
          {task.text}
        </button>
        {dragHandleProps && mode === "open" && (
          <button
            type="button"
            aria-label="Drag to reorder"
            {...dragHandleProps}
            className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-muted/70 active:cursor-grabbing"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5h0M15 5h0M9 12h0M15 12h0M9 19h0M15 19h0"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {editing && (
        <EditSheet
          task={task}
          onClose={() => setEditing(false)}
          onSave={(text, due) => {
            if (text !== task.text) onUpdateText(task.id, text);
            if (due !== task.due_date) onReschedule(task.id, due);
            setEditing(false);
          }}
          onDelete={() => {
            onDelete(task.id);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function EditSheet({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onSave: (text: string, due: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(task.text);
  const [due, setDue] = useState(task.due_date);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, []);

  const dirty = text.trim() !== task.text || due !== task.due_date;
  const canSave = text.trim().length > 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end bg-black/40"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-md rounded-t-2xl border-t border-border bg-card p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <p className="mb-3 text-sm font-medium text-muted">Edit task</p>

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted/80">
          Task
        </label>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSave) onSave(text.trim(), due);
          }}
          placeholder="Task name"
          className="mb-4 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-accent"
        />

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted/80">
          Due date
        </label>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="mb-5 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-accent"
        />

        <div className="flex gap-2">
          <button
            onClick={onDelete}
            className="rounded-xl border border-border px-4 py-3 text-base text-red-500"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(text.trim(), due)}
            disabled={!canSave || !dirty}
            className="flex-1 rounded-xl bg-accent px-4 py-3 text-base font-medium text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
