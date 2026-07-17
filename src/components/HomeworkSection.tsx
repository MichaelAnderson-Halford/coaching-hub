"use client";

import { useState } from "react";

type HomeworkItem = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
};

export default function HomeworkSection({
  clientId,
  items,
  onChanged,
}: {
  clientId: string;
  items: HomeworkItem[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, title, dueDate: dueDate || null }),
    });
    setTitle("");
    setDueDate("");
    onChanged();
  }

  async function toggle(id: string, completed: boolean) {
    await fetch(`/api/homework/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    onChanged();
  }

  async function remove(id: string) {
    await fetch(`/api/homework/${id}`, { method: "DELETE" });
    onChanged();
  }

  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <section className="bg-panel border border-line rounded-card p-6 mb-6">
      <h2 className="font-display text-lg mb-4">Homework</h2>

      <form onSubmit={addItem} className="flex flex-wrap gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add something to do before next session…"
          className="focus-ring flex-1 min-w-[12rem] rounded-md border border-line px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="focus-ring rounded-md bg-teal text-white text-sm px-4 py-2 hover:bg-teal-dark"
        >
          Add
        </button>
      </form>

      {todo.length === 0 ? (
        <p className="text-sm text-ink/40 italic mb-2">Nothing outstanding.</p>
      ) : (
        <ul className="space-y-2 mb-2">
          {todo.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 text-sm border border-line rounded-md px-3 py-2"
            >
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggle(i.id, true)}
                  className="accent-teal"
                />
                <span>{i.title}</span>
              </label>
              <div className="flex items-center gap-3 shrink-0">
                {i.dueDate && (
                  <span className="text-xs text-ink/40 font-mono">
                    {new Date(i.dueDate).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => remove(i.id)}
                  className="focus-ring text-xs text-ink/30 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-ink/40 cursor-pointer hover:text-ink">
            {done.length} completed
          </summary>
          <ul className="space-y-2 mt-2">
            {done.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 text-sm px-3 py-2"
              >
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggle(i.id, false)}
                    className="accent-teal"
                  />
                  <span className="line-through text-ink/40">{i.title}</span>
                </label>
                <button
                  onClick={() => remove(i.id)}
                  className="focus-ring text-xs text-ink/30 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
