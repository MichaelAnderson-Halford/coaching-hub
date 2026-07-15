export async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  const missing = [
    !accountId && "ZOOM_ACCOUNT_ID",
    !clientId && "ZOOM_CLIENT_ID",
    !clientSecret && "ZOOM_CLIENT_SECRET",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom token request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}
