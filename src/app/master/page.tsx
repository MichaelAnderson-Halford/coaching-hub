"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  clientCount: number;
  lastActivityAt: string | null;
  mrr: number;
};

type Overview = {
  organizations: OrgRow[];
  totalMrr: number;
  totalClients: number;
};

function planBadge(org: OrgRow) {
  if (org.plan === "internal") {
    return <span className="text-xs text-ink/40">Internal</span>;
  }
  if (org.plan === "paid") {
    const isPastDue = org.subscriptionStatus === "past_due";
    return (
      <span className={`text-xs font-medium ${isPastDue ? "text-red-700" : "text-teal"}`}>
        {isPastDue ? "Past due" : "Paid"}
      </span>
    );
  }
  const daysLeft = org.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  return (
    <span className="text-xs text-gold">
      Trial{daysLeft !== null ? ` — ${daysLeft}d left` : ""}
    </span>
  );
}

export default function MasterPortalPage() {
  const { update } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [entering, setEntering] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/master/overview")
      .then((r) => r.json())
      .then(setData);
  }, []);

  async function actAs(orgId: string) {
    setEntering(orgId);
    await update({ viewOrgId: orgId });
    router.push("/admin");
  }

  if (!data) {
    return <main className="px-6 py-10 max-w-5xl mx-auto text-sm text-ink/40">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Master Portal</h1>
          <p className="text-sm text-ink/60 mt-1">Every organization on the platform.</p>
        </div>
        <Link href="/master/site-settings" className="focus-ring text-sm text-ink/50 hover:text-ink underline underline-offset-4 mr-4">
          Website Content
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="focus-ring text-sm text-ink/50 hover:text-ink underline underline-offset-4"
        >
          Sign out
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <section className="bg-panel border border-line rounded-card p-5">
          <p className="text-xs font-medium text-ink/40 uppercase tracking-wide">Organizations</p>
          <p className="font-display text-3xl text-ink mt-1">{data.organizations.length}</p>
        </section>
        <section className="bg-panel border border-line rounded-card p-5">
          <p className="text-xs font-medium text-ink/40 uppercase tracking-wide">Total clients</p>
          <p className="font-display text-3xl text-ink mt-1">{data.totalClients}</p>
        </section>
        <section className="bg-panel border border-line rounded-card p-5">
          <p className="text-xs font-medium text-ink/40 uppercase tracking-wide">MRR (est.)</p>
          <p className="font-display text-3xl text-ink mt-1">${data.totalMrr}</p>
        </section>
      </div>

      <section className="bg-panel border border-line rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink/40 uppercase tracking-wide">
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Clients</th>
              <th className="px-4 py-3">MRR</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.organizations.map((org) => (
              <tr key={org.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{org.name}</p>
                  <p className="text-xs text-ink/40">{org.slug}</p>
                </td>
                <td className="px-4 py-3">{planBadge(org)}</td>
                <td className="px-4 py-3">{org.clientCount}</td>
                <td className="px-4 py-3">${org.mrr}</td>
                <td className="px-4 py-3 text-xs text-ink/60">
                  {org.lastActivityAt
                    ? new Date(org.lastActivityAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-ink/60">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => actAs(org.id)}
                    disabled={entering !== null}
                    className="focus-ring text-xs font-medium text-teal hover:text-teal-dark underline underline-offset-2 disabled:opacity-40"
                  >
                    {entering === org.id ? "Entering…" : "Act as →"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
