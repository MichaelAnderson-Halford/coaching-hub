"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { name: string; role: "ADMIN" | "CLIENT" };
};

export default function MessageBoard({
  clientId,
  currentUserId,
}: {
  clientId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/messages?clientId=${clientId}`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, content: draft }),
    });
    setSending(false);
    if (res.ok) {
      setDraft("");
      load();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-80">
        {messages.length === 0 && (
          <p className="text-sm text-ink/40 italic">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2 border-t border-line pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isCoach = message.sender.role === "ADMIN";
  return (
    <div className={`flex ${isCoach ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          isCoach ? "bg-teal-light text-ink" : "bg-gold-light text-ink"
        }`}
      >
        <p className="text-xs font-medium text-ink/50 mb-0.5">{message.sender.name}</p>
        <p>{message.content}</p>
        <p className="mt-1 text-[10px] font-mono text-ink/40">
          {new Date(message.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
