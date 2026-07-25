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

  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}
