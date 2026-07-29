import { prisma } from "./prisma";

// Verifies the logged-in session both has permission to act on the given
// clientId (same rules as before: admins can access any client in their
// org, a client can only access themselves) AND that the target client
// actually belongs to the same organization as the session. The org
// check is what keeps Company A from ever reaching Company B's data,
// even if a clientId is guessed or leaked.
export async function checkOrgAccess(session: any, clientId: string): Promise<boolean> {
  if (!session?.user) return false;

  const target = await prisma.user.findUnique({
    where: { id: clientId },
    select: { organizationId: true },
  });
  if (!target) return false;

  if (target.organizationId !== session.user.organizationId) return false;

  if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") return true;
  return session.user.id === clientId;
}

// Same as checkOrgAccess, but for checking access via a Business's
// linked ClientAccount (used by metrics/projects routes, which reach
// the client through a business rather than a direct clientId).
export async function checkBusinessOrgAccess(session: any, businessId: string): Promise<boolean> {
  if (!session?.user) return false;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      clientAccount: {
        select: { organizationId: true, owners: { select: { id: true } } },
      },
    },
  });
  if (!business || !business.clientAccount) return false;
  if (business.clientAccount.organizationId !== session.user.organizationId) return false;

  if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") return true;

  return business.clientAccount.owners.some((o: { id: string }) => o.id === session.user.id);
}
