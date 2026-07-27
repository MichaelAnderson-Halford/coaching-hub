export const PLAN_LIMITS = {
  starter: { maxClients: 15, maxCoaches: 1, customDomain: false },
  growth: { maxClients: 50, maxCoaches: 5, customDomain: true },
  scale: { maxClients: Infinity, maxCoaches: Infinity, customDomain: true },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

// Provider Pro (internal) and any org still on trial have no enforced
// caps — trial gets generous access to encourage signup, internal never
// gets billed at all.
export function getLimitsForOrg(org: { plan: string; tier: string | null }) {
  if (org.plan === "internal" || org.plan === "trial") {
    return { maxClients: Infinity, maxCoaches: Infinity, customDomain: false };
  }
  const tier = (org.tier as PlanTier) || "starter";
  return PLAN_LIMITS[tier] || PLAN_LIMITS.starter;
}
