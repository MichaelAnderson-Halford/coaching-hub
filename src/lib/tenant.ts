import { prisma } from "./prisma";

const BASE_DOMAIN = process.env.BASE_DOMAIN || "";

// Given an incoming request's Host header, figures out which
// organization (if any) it belongs to. Returns null for the bare base
// domain (e.g. "providerpro.co.uk" or "www.providerpro.co.uk") — that's
// treated as "no specific tenant", used for the master portal / general
// marketing entry point. Any other hostname is checked first as a
// subdomain of BASE_DOMAIN (e.g. "acme.providerpro.co.uk" -> slug
// "acme"), then as a fully custom domain a company has connected.
export async function resolveOrgFromHost(hostHeader: string | null) {
  if (!hostHeader || !BASE_DOMAIN) return null;

  const host = hostHeader.split(":")[0].toLowerCase();
  const base = BASE_DOMAIN.toLowerCase();

  if (host === base || host === `www.${base}`) {
    return null;
  }

  if (host.endsWith(`.${base}`)) {
    const slug = host.slice(0, -(`.${base}`.length));
    return prisma.organization.findUnique({ where: { slug } });
  }

  return prisma.organization.findUnique({ where: { customDomain: host } });
}
