import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { escapeHtml } from "./sanitize";

function appUrl() {
  return process.env.NEXTAUTH_URL || "";
}

async function getRecipients(clientId: string, excludeUserId: string) {
  const [client, admins] = await Promise.all([
    prisma.user.findUnique({ where: { id: clientId }, select: { id: true, name: true, email: true } }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, name: true, email: true } }),
  ]);

  const all = [client, ...admins].filter(
    (u): u is { id: string; name: string; email: string } => !!u && u.id !== excludeUserId
  );
  return all;
}

export async function notifyNewMessage(
  clientId: string,
  senderId: string,
  senderName: string,
  senderIsClient: boolean,
  content: string
) {
  const recipients = await getRecipients(clientId, senderId);
  const link = `${appUrl()}${senderIsClient ? "/admin/" + clientId : "/dashboard"}`;
  const safeName = escapeHtml(senderName);
  const safeContent = escapeHtml(content);

  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject: `New message from ${safeName}`,
        html: `<p><strong>${safeName}</strong> sent a new message:</p><p style="padding:12px;background:#f5f5f7;border-radius:8px;">${safeContent}</p><p><a href="${link}">View it in the Coaching Hub</a></p>`,
      })
    )
  );
}

export async function notifyNewWin(clientId: string, creatorId: string, content: string) {
  const recipients = await getRecipients(clientId, creatorId);
  const link = `${appUrl()}/admin/${clientId}`;
  const safeContent = escapeHtml(content);

  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject: "A new win was logged 🎉",
        html: `<p>A new win was logged:</p><p style="padding:12px;background:#f5f5f7;border-radius:8px;">${safeContent}</p><p><a href="${link}">View it in the Coaching Hub</a></p>`,
      })
    )
  );
}

export async function sendSessionReminder(clientId: string, clientName: string, meetingAt: Date, zoomLink: string | null) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  const client = await prisma.user.findUnique({ where: { id: clientId }, select: { email: true } });

  const recipients = [...admins.map((a: { email: string }) => a.email), client?.email].filter(Boolean) as string[];
  const safeName = escapeHtml(clientName);
  const when = meetingAt.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await Promise.all(
    recipients.map((email) =>
      sendEmail({
        to: email,
        subject: `Upcoming session with ${safeName}`,
        html: `<p>Reminder: a coaching session with <strong>${safeName}</strong> is coming up on <strong>${when}</strong>.</p>${
          zoomLink ? `<p><a href="${zoomLink}">Join Zoom</a></p>` : ""
        }`,
      })
    )
  );
}
