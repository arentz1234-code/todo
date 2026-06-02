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
};

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getClient() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = getClient();
      await supabase.rpc("roll_forward_open_tasks");
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("[tasks load]", error);
        setTasks([]);
      } else {
        setTasks((data ?? []) as Task[]);
      }
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const supabase = getClient();
    const channel = supabase
      .channel("tasks-sync")
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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const add = useCallback((text: string, dueDate?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const optimistic: Task = {
      id: uid(),
      text: trimmed,
      due_date: dueDate ?? todayISO(),
      completed_at: null,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    (async () => {
      const supabase = getClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          text: optimistic.text,
          due_date: optimistic.due_date,
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

  const pushToTomorrow = useCallback(
    (id: string) => reschedule(id, addDaysISO(todayISO(), 1)),
    [reschedule],
  );

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
    hydrated,
    add,
    complete,
    uncomplete,
    reschedule,
    pushToTomorrow,
    remove,
  };
}
