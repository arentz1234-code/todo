"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  day: string;
  value: string;
  onChange: (day: string, content: string) => void;
  placeholder?: string;
  compact?: boolean;
};

export function DayNote({
  day,
  value,
  onChange,
  placeholder = "What's happening today?",
  compact,
}: Props) {
  const [local, setLocal] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  function resize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    resize(textareaRef.current);
  }, [local]);

  return (
    <textarea
      ref={textareaRef}
      value={local}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
      }}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange(day, e.target.value);
      }}
      placeholder={placeholder}
      rows={compact ? 1 : 2}
      className={`w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base leading-snug outline-none placeholder:text-muted/70 focus:border-accent ${
        compact ? "text-sm" : ""
      }`}
    />
  );
}
