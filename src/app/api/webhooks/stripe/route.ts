import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { provisionSubdomain } from "@/lib/provisionDomain";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (organizationId && session.subscription) {
        const org = await prisma.organization.update({
          where: { id: organizationId },
          data: {
            stripeSubscriptionId: session.subscription as string,
            plan: "paid",
            tier: session.metadata?.tier || "starter",
            subscriptionStatus: "active",
          },
        });

        // Only now — once payment has actually succeeded — do we give
        // this organization its own subdomain. Trial orgs use the bare
        // base domain with no subdomain of their own.
        provisionSubdomain(org.slug).catch((err) =>
          console.error("provisionSubdomain failed:", err)
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionStatus: subscription.status,
            plan: subscription.status === "active" ? "paid" : org.plan,
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: "past_due" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
