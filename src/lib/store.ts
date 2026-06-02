"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { todayISO, addDaysISO } from "./date";
import { createClient } from "@/utils/supabase/client";

export type Task = {
  id: string;
  text: string;
  due_date: string;
  completed_at: string | null;
  created_at: string;
  sort_order: number;
};

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const noteSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function getClient() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = getClient();
      await supabase.rpc("roll_forward_open_tasks");
      const [tasksRes, notesRes] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("day_notes").select("day, content"),
      ]);
      if (!active) return;
      if (tasksRes.error) console.error("[tasks load]", tasksRes.error);
      setTasks((tasksRes.data ?? []) as Task[]);
      if (notesRes.error) console.error("[notes load]", notesRes.error);
      const noteMap: Record<string, string> = {};
      for (const row of (notesRes.data ?? []) as { day: string; content: string }[]) {
        noteMap[row.day] = row.content;
      }
      setNotes(noteMap);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const supabase = getClient();
    const channel = supabase
      .channel("daily-todo-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setTasks((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Task;
              if (prev.some((t) => t.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Task;
              return prev.map((t) => (t.id === row.id ? row : t));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Task;
              return prev.filter((t) => t.id !== row.id);
            }
            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day_notes" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const row = payload.old as { day: string };
            setNotes((prev) => {
              const next = { ...prev };
              delete next[row.day];
              return next;
            });
            return;
          }
          const row = payload.new as { day: string; content: string };
          setNotes((prev) => ({ ...prev, [row.day]: row.content }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const add = useCallback((text: string, dueDate?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const targetDay = dueDate ?? todayISO();
    const maxSort = tasks
      .filter((t) => t.due_date === targetDay && !t.completed_at)
      .reduce((m, t) => Math.max(m, t.sort_order), -1);
    const optimistic: Task = {
      id: uid(),
      text: trimmed,
      due_date: targetDay,
      completed_at: null,
      created_at: new Date().toISOString(),
      sort_order: maxSort + 1,
    };
    setTasks((prev) => [...prev, optimistic]);
    (async () => {
      const supabase = getClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          text: optimistic.text,
          due_date: optimistic.due_date,
          sort_order: optimistic.sort_order,
        })
        .select()
        .single();
      if (error) {
        console.error("[tasks add]", error);
        setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === optimistic.id ? (data as Task) : t)),
      );
    })();
  }, []);

  const patch = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      (async () => {
        const supabase = getClient();
        const { error } = await supabase
          .from("tasks")
          .update(patch)
          .eq("id", id);
        if (error) console.error("[tasks patch]", error);
      })();
    },
    [],
  );

  const complete = useCallback(
    (id: string) => patch(id, { completed_at: new Date().toISOString() }),
    [patch],
  );

  const uncomplete = useCallback(
    (id: string) =>
      patch(id, { completed_at: null, due_date: todayISO() }),
    [patch],
  );

  const reschedule = useCallback(
    (id: string, due: string) =>
      patch(id, { due_date: due, completed_at: null }),
    [patch],
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      patch(id, { text: trimmed });
    },
    [patch],
  );

  const pushToTomorrow = useCallback(
    (id: string) => reschedule(id, addDaysISO(todayISO(), 1)),
    [reschedule],
  );

  const setNote = useCallback((day: string, content: string) => {
    setNotes((prev) => ({ ...prev, [day]: content }));
    if (noteSaveTimers.current[day]) {
      clearTimeout(noteSaveTimers.current[day]);
    }
    noteSaveTimers.current[day] = setTimeout(async () => {
      const supabase = getClient();
      if (content.trim().length === 0) {
        const { error } = await supabase
          .from("day_notes")
          .delete()
          .eq("day", day);
        if (error) console.error("[note delete]", error);
      } else {
        const { error } = await supabase
          .from("day_notes")
          .upsert({ day, content, updated_at: new Date().toISOString() });
        if (error) console.error("[note save]", error);
      }
    }, 500);
  }, []);

  const reorder = useCallback((orderedIds: string[]) => {
    setTasks((prev) => {
      const indexMap = new Map(orderedIds.map((id, idx) => [id, idx]));
      return prev.map((t) =>
        indexMap.has(t.id) ? { ...t, sort_order: indexMap.get(t.id)! } : t,
      );
    });
    (async () => {
      const supabase = getClient();
      const updates = orderedIds.map((id, idx) =>
        supabase.from("tasks").update({ sort_order: idx }).eq("id", id),
      );
      const results = await Promise.all(updates);
      for (const r of results) {
        if (r.error) console.error("[reorder]", r.error);
      }
    })();
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    (async () => {
      const supabase = getClient();
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) console.error("[tasks delete]", error);
    })();
  }, []);

  return {
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
  };
}
