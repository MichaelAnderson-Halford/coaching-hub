import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PRICE_IDS, PlanTier } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { tier } = await req.json();
  if (!tier || !(tier in PRICE_IDS)) {
    return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[tier as PlanTier], quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/admin/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/admin/billing?canceled=true`,
    metadata: { organizationId: org.id, tier },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
