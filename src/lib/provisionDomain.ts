const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN || "";
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || "";
const BASE_DOMAIN = process.env.BASE_DOMAIN || "";

// Creates a CNAME record in Cloudflare for the new tenant's subdomain,
// then registers that subdomain on the Vercel project. Runs at signup
// time so a brand-new company's subdomain works within seconds, with no
// manual DNS/Vercel steps needed. Failures here are logged but don't
// block signup — the org still gets created even if domain provisioning
// hiccups, since a superadmin can always add it manually as a fallback.
export async function provisionSubdomain(slug: string): Promise<void> {
  if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN || !VERCEL_API_TOKEN || !VERCEL_PROJECT_ID || !BASE_DOMAIN) {
    console.error("provisionSubdomain: missing required env vars, skipping");
    return;
  }

  const fullDomain = `${slug}.${BASE_DOMAIN}`;

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: slug,
          content: "cname.vercel-dns.com",
          proxied: false,
          ttl: 1,
        }),
      }
    );
    const cfData = await cfRes.json();
    if (!cfData.success) {
      console.error("Cloudflare DNS record creation failed:", cfData.errors);
    }
  } catch (err) {
    console.error("Cloudflare API call failed:", err);
  }

  try {
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: fullDomain }),
      }
    );
    const vercelData = await vercelRes.json();
    if (vercelData.error) {
      console.error("Vercel domain registration failed:", vercelData.error);
    }
  } catch (err) {
    console.error("Vercel API call failed:", err);
  }
}
