"use client";

import { useRef, useState } from "react";

export function AddTaskBar({
  onAdd,
  dueDate,
}: {
  onAdd: (text: string, dueDate?: string) => void;
  dueDate?: string;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const value = text.trim();
    if (!value) return;
    onAdd(value, dueDate);
    setText("");
    inputRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-label="Add task"
        className="fixed bottom-20 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light text-white shadow-lg active:scale-95"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-14 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mx-auto flex max-w-md items-center gap-2 p-3"
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setTimeout(() => {
              if (!text.trim()) setOpen(false);
            }, 150);
          }}
          placeholder="New task…"
          className="flex-1 rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-xl bg-accent px-4 py-3 text-base font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
