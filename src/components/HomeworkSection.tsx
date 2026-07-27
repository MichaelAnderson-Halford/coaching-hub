"use client";

import { useState } from "react";

type HomeworkItem = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  projectId: string | null;
  businessId: string | null;
};

type ProjectSummary = { id: string; name: string };
type Business = { id: string; name: string; projects: ProjectSummary[] };

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
  const [activeBusinessId, setActiveBusinessId] = useState(businesses[0]?.id || "");
  const [newProjectName, setNewProjectName] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0];

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim() || !activeBusiness) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: activeBusiness.id, name: newProjectName }),
    });
    setNewProjectName("");
    setShowAddProject(false);
    onChanged();
  }

  async function renameProject(projectId: string) {
    if (!renameDraft.trim()) return;
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameDraft }),
    });
    setRenamingProjectId(null);
    onChanged();
  }

  async function deleteProject(projectId: string, name: string) {
    if (
      !confirm(
        `Delete "${name}"? Any tasks in it will move to General rather than being deleted.`
      )
    )
      return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    onChanged();
  }

  if (!activeBusiness) {
    return <p className="text-sm text-ink/40 italic">No business found for this client.</p>;
  }

  const showBusinessPicker = businesses.length > 1;

  // Group this business's tasks by project. Tasks with no projectId (or
  // one that no longer matches a current project) land in "General".
  const businessItems = items.filter((i) => i.businessId === activeBusiness.id);
  const groups: { key: string; label: string; projectId: string | null; items: HomeworkItem[] }[] = [
    ...activeBusiness.projects.map((p) => ({
      key: p.id,
      label: p.name,
      projectId: p.id,
      items: businessItems.filter((i) => i.projectId === p.id),
    })),
    {
      key: "__general__",
      label: "General",
      projectId: null,
      items: businessItems.filter(
        (i) => !i.projectId || !activeBusiness.projects.some((p) => p.id === i.projectId)
      ),
    },
  ];

  return (
    <section className="bg-panel border border-line rounded-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-display text-lg">Projects</h2>
        {showBusinessPicker && (
          <select
            value={activeBusiness.id}
            onChange={(e) => setActiveBusinessId(e.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-1.5 text-sm"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-6">
        {showAddProject ? (
          <form onSubmit={addProject} className="flex gap-2">
            <input
              autoFocus
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddProject(false)}
              className="focus-ring rounded-md border border-line text-ink/60 text-sm px-4 py-2 hover:text-ink"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddProject(true)}
            className="focus-ring text-sm text-teal hover:text-teal-dark font-medium"
          >
            + Add project
          </button>
        )}
      </div>

      {activeBusiness.projects.length === 0 && (
        <div className="text-center py-6 mb-2">
          <p className="font-medium text-ink">No projects yet</p>
          <p className="text-xs text-ink/50 mt-1">
            Create a project above to start organizing tasks for {activeBusiness.name}.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <ProjectBlock
          key={group.key}
          clientId={clientId}
          label={group.label}
          projectId={group.projectId}
          items={group.items}
          isRenaming={renamingProjectId === group.projectId}
          renameDraft={renameDraft}
          onStartRename={() => {
            setRenamingProjectId(group.projectId);
            setRenameDraft(group.label);
          }}
          onRenameChange={setRenameDraft}
          onRenameSave={() => group.projectId && renameProject(group.projectId)}
          onRenameCancel={() => setRenamingProjectId(null)}
          onDelete={
            group.projectId ? () => deleteProject(group.projectId as string, group.label) : undefined
          }
          onChanged={onChanged}
        />
      ))}
    </section>
  );
}

function ProjectBlock({
  clientId,
  label,
  projectId,
  items,
  isRenaming,
  renameDraft,
  onStartRename,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
  onDelete,
  onChanged,
}: {
  clientId: string;
  label: string;
  projectId: string | null;
  items: HomeworkItem[];
  isRenaming: boolean;
  renameDraft: string;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameSave: () => void;
  onRenameCancel: () => void;
  onDelete?: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title,
        dueDate: dueDate || null,
        projectId,
      }),
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

  if (label === "General" && items.length === 0) return null;

  return (
    <div className="mb-6 last:mb-0 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-3">
        {isRenaming ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onRenameSave()}
              className="focus-ring flex-1 rounded-md border border-line px-2 py-1 text-sm font-display"
            />
            <button onClick={onRenameSave} className="focus-ring text-xs text-teal font-medium">
              Save
            </button>
            <button onClick={onRenameCancel} className="focus-ring text-xs text-ink/50">
              Cancel
            </button>
          </div>
        ) : (
          <h3 className="font-display text-base text-ink">
            {label}
            {projectId && (
              <button
                onClick={onStartRename}
                className="focus-ring ml-2 text-xs font-body text-ink/30 hover:text-teal underline decoration-dotted underline-offset-2"
              >
                Rename
              </button>
            )}
          </h3>
        )}
        {onDelete && !isRenaming && (
          <button
            onClick={onDelete}
            className="focus-ring text-xs text-ink/30 hover:text-red-700 transition-colors"
          >
            Delete project
          </button>
        )}
      </div>

      <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="focus-ring flex-1 min-w-[10rem] rounded-md border border-line px-3 py-2 text-sm"
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

      {items.length === 0 ? (
        <div className="text-center py-4">
          <p className="font-medium text-sm text-ink">Nothing due yet</p>
          <p className="text-xs text-ink/50 mt-1">
            Add a task above to get this project moving.
          </p>
        </div>
      ) : (
        <>
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
            <details className="mt-2">
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
        </>
      )}
    </div>
  );
}
