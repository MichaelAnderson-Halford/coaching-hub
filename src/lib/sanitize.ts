// Escapes user-supplied text before it gets embedded into an email's HTML,
// so a message, win, or note containing things like < > & " can never be
// interpreted as markup by an email client.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
