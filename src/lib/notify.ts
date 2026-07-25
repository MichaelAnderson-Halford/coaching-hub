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

export async function sendProjectReminder(
  clientId: string,
  clientName: string,
  items: { title: string; dueDate: Date; overdue: boolean }[]
) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  const client = await prisma.user.findUnique({ where: { id: clientId }, select: { email: true } });

  const recipients = [...admins.map((a: { email: string }) => a.email), client?.email].filter(
    Boolean
  ) as string[];
  const safeName = escapeHtml(clientName);
  const link = `${appUrl()}/admin/${clientId}`;

  const listHtml = items
    .map((i) => {
      const when = i.dueDate.toLocaleDateString(undefined, { month: "long", day: "numeric" });
      const label = i.overdue ? `overdue (was due ${when})` : `due ${when}`;
      return `<li>${escapeHtml(i.title)} — <strong>${label}</strong></li>`;
    })
    .join("");

  await Promise.all(
    recipients.map((email) =>
      sendEmail({
        to: email,
        subject: `Project reminder for ${safeName}`,
        html: `<p>${safeName} has ${items.length} project${items.length === 1 ? "" : "s"} needing attention:</p><ul>${listHtml}</ul><p><a href="${link}">View in the Coaching Hub</a></p>`,
      })
    )
  );
}

export async function sendWelcomeResendEmail(
  clientId: string,
  clientName: string,
  clientEmail: string
) {
  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours, more generous for a bulk resend

  await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: clientId },
  });

  const resetUrl = `${appUrl()}/reset-password/${token}`;
  const firstName = clientName.split(" ")[0];
  const site = "www.thecoachinghub.providerpro.co.uk";

  const html = `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Big news — Michael has been quietly grinding away behind the scenes for weeks, building something truly next-level just for you, and today it finally launches: Coaching Hub is LIVE!</p>
    <p>This isn't just another login page — it's a whole new home for our work together. Built from scratch, designed with you in mind, and packed with everything you need to stay on track and crush your goals. We could not be more excited to hand you the keys.</p>
    <p><strong>Welcome aboard — your account is set up and ready to go!</strong></p>
    <p>Coaching Hub is your personal dashboard for everything happening in our work together — session details, homework and projects, and updates, all in one place.</p>

    <p><strong>Your Login Details</strong></p>
    <ul>
      <li>Website: ${escapeHtml(site)}</li>
      <li>Username: ${escapeHtml(clientEmail)}</li>
    </ul>
    <p><a href="${resetUrl}">Set your password</a> to finish setting up your account. This link expires in 24 hours.</p>

    <p><strong>Getting Started</strong></p>
    <ol>
      <li>Click the link above to set your password.</li>
      <li>Sign in at ${escapeHtml(site)}.</li>
      <li>Take a look around your dashboard to get familiar with your space.</li>
    </ol>

    <p><strong>How to Use Coaching Hub</strong></p>
    <ul>
      <li><strong>Dashboard:</strong> Your home base — a quick overview of your activity and what's coming up.</li>
      <li><strong>Projects:</strong> This is where your homework and action items live, grouped by project so it's easy to track what belongs to what. If you're working across more than one area with us, you'll see a dropdown to switch between them.</li>
      <li><strong>Sessions:</strong> Details on your upcoming coaching calls, including Zoom links, will show up here.</li>
      <li><strong>Notifications:</strong> You'll get email updates for key activity (like new homework or session reminders) sent to the address on file — no need to keep checking back manually.</li>
    </ul>

    <p>If anything looks off or you have questions getting started, just reply to this email and we'll sort it out.</p>
    <p>Welcome to the future of our coaching journey together!</p>
    <p>Warm regards,<br/>Michael Anderson-Halford<br/>Provider Pro / Coaching Hub</p>
  `;

  await sendEmail({
    to: clientEmail,
    subject: "It's Here — Welcome to Coaching Hub!",
    html,
  });
}
