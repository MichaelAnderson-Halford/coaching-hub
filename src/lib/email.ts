export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Not configured yet — skip quietly rather than break saves.

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Provider Pro Coaching Hub <notifications@providerpro.co.uk>",
        to,
        subject,
        html,
      }),
    });
  } catch {
    // Email failures should never block the actual save the person was
    // trying to make.
  }
}
