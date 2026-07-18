export default function ClientMessageCard({
  message,
  updatedAt,
}: {
  message: string | null;
  updatedAt: string | null;
}) {
  if (!message) return null;

  return (
    <section className="bg-gradient-to-br from-teal-light to-gold-light border border-teal/30 rounded-card p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg">💌 A note from your coaching team</h2>
        {updatedAt && (
          <span className="text-xs text-ink/50 font-mono">
            {new Date(updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
    </section>
  );
}
