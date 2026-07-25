"use client";

import { useState } from "react";

type HomeworkItem = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  businessId: string | null;
};

type Business = { id: string; name: string };

export default function HomeworkSection({
  clientId,
  items,
  businesses,
  onChanged,
}: {
  clientId: string;
  items: HomeworkItem[];
  businesses: Business[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [splitting, setSplitting] = useState(false);

  const showBusinessPicker = businesses.length > 1;

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title,
        dueDate: dueDate || null,
        businessId: businessId || null,
      }),
    });
    setTitle("");
    setDueDate("");
    onChanged();
  }

  function extractBulletLines(text: string): string[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^[●•\-*▪]\s+/.test(line))
      .map((line) => line.replace(/^[●•\-*▪]\s+/, "").trim())
      .filter(Boolean);
  }

  async function splitPaste(e: React.FormEvent) {
    e.preventDefault();
    const bulletItems = extractBulletLines(pasteText);
    if (bulletItems.length === 0) return;
    setSplitting(true);
    try {
      await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          items: bulletItems,
          businessId: businessId || null,
        }),
      });
      setPasteText("");
      setShowPaste(false);
      onChanged();
    } finally {
      setSplitting(false);
    }
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

  // Group items by business. Items with no businessId (or one that no
  // longer matches a current business) land in a "General" group. If
  // there are zero or one businesses, no grouping headers are shown.
  const groups: { key: string; label: string; items: HomeworkItem[] }[] = [
    ...businesses.map((b) => ({
      key: b.id,
      label: b.name,
      items: items.filter((i) => i.businessId === b.id),
    })),
    {
      key: "__general__",
      label: businesses.length > 0 ? "General" : "Homework",
      items: items.filter(
        (i) => !i.businessId || !businesses.some((b) => b.id === i.businessId)
      ),
    },
  ];

  return (
    <section className="bg-panel border border-line rounded-card p-6 mb-6">
      <h2 className="font-display text-lg mb-4">Projects</h2>

      <form onSubmit={addItem} className="flex flex-wrap gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add something to do before next session…"
          className="focus-ring flex-1 min-w-[12rem] rounded-md border border-line px-3 py-2 text-sm"
        />
        {showBusinessPicker && (
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">No project</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
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

      <div className="mb-4">
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="focus-ring text-xs text-ink/40 hover:text-ink underline underline-offset-4"
        >
          {showPaste ? "Cancel" : "Paste from Zoom notes"}
        </button>
      </div>

      {showPaste && (
        <form onSubmit={splitPaste} className="mb-4">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Paste the \"Next steps\" section here — each bulleted line (●, •, or -) becomes its own homework item."}
            rows={6}
            className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm leading-relaxed mb-2"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={splitting || extractBulletLines(pasteText).length === 0}
              className="focus-ring rounded-md bg-teal text-white text-sm px-4 py-2 hover:bg-teal-dark disabled:opacity-40"
            >
              {splitting
                ? "Adding…"
                : `Split into ${extractBulletLines(pasteText).length || ""} item${extractBulletLines(pasteText).length === 1 ? "" : "s"}`}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && (
        <div className="text-center py-6"><p className="font-medium text-ink">Nothing due yet</p><p className="text-xs text-ink/50 mt-1">Give this client something to work on before the next session.</p></div>
      )}

      {groups.map((group) => {
        const todo = group.items.filter((i) => !i.completed);
        const done = group.items.filter((i) => i.completed);
        if (todo.length === 0 && done.length === 0) return null;

        return (
          <div key={group.key} className="mb-6 last:mb-0">
            {businesses.length > 0 && (
              <h3 className="text-xs font-medium uppercase tracking-wide text-ink/40 mb-2">
                {group.label}
              </h3>
            )}

            {todo.length > 0 && (
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
          </div>
        );
      })}
    </section>
  );
}
