export async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom API credentials are not configured");
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
    throw new Error(`Failed to get Zoom access token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}
