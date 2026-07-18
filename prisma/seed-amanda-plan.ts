import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const amanda = await prisma.user.findFirst({ where: { name: { contains: "Amanda Askew" } } });
  if (!amanda) {
    console.log("Couldn't find Amanda Askew — skipping.");
    return;
  }

  await prisma.plan.deleteMany({ where: { clientId: amanda.id } });

  await prisma.plan.create({
    data: {
      clientId: amanda.id,
      quarterLabel: "Q3 2026",
      startDate: new Date("2026-07-13"),
      endDate: new Date("2026-09-30"),
      advisorName: "Ben Anderson-Halford",
      sections: {
        create: [
          {
            businessName: "Cleaning Entrepreneurs Network (CEN)",
            theme: "OPEN",
            themeDescription:
              "This quarter is about opening CEN to the market properly — a repeatable Lead Generation Event engine, a founding-member campaign to Amanda's own network, and the content and backend systems to support it. The goal is a clear, repeatable way to bring in new members, not one-off pushes.",
            recommendations: [
              "Repurpose every LGE as content: One reel/post per event as standard practice, rather than a separate content calendar.",
              "Start the DM list with warm contacts: The founding-member outreach should begin with people who already know Amanda, not cold connections.",
              "Tag leads from day one: A simple tagging process for LGE, DM and mailing-list leads so nothing is lost as volume grows.",
              "Scope the roadshow, don't commit yet: Worth exploring as an idea, not worth launching before it's properly costed out.",
            ].join("\n"),
            order: 0,
            kpis: {
              create: [
                { name: "LGEs run this quarter", value: "To confirm", order: 0 },
                { name: "New members via DM & LGE", value: "To confirm", order: 1 },
                { name: "Founding members signed", value: "To confirm", order: 2 },
              ],
            },
            projects: {
              create: [
                {
                  name: "Open the Community",
                  outcome:
                    "Grow CEN membership through a monthly Lead Generation Event engine, a DM founding-member campaign, and mailing list activation.",
                  keyApproach: [
                    "Launch a monthly LGE engine with landing pages & conversion plans",
                    "Run a DM founding-member campaign with an offer & tracker",
                    "Decide the Skool group's role; activate the mailing list",
                  ].join("\n"),
                  measures: [
                    "LGEs mapped and running monthly",
                    "DM campaign sent, tracked and converting",
                    "Skool group & mailing list decisions agreed",
                  ].join("\n"),
                  month1Label: "Build the Engine",
                  month2Label: "Launch & Convert",
                  month3Label: "Repeat & Expand",
                  order: 0,
                },
                {
                  name: "Build Authentic Authority",
                  outcome:
                    "Build a consistent, benchmarked, authentic social media and content presence for CEN, aligned to the LGEs.",
                  keyApproach: [
                    "Benchmark industry & out-of-industry marketing",
                    "Align content strategy to the monthly LGEs",
                    "Map out August & September content plans with Ben",
                  ].join("\n"),
                  measures: [
                    "Benchmarking review completed",
                    "August & September plans agreed",
                    "Content rhythm maintained; reviewed monthly",
                  ].join("\n"),
                  month1Label: "Research & Strategy",
                  month2Label: "Plan & Produce",
                  month3Label: "Maintain Rhythm",
                  order: 1,
                },
                {
                  name: "Strengthen Backend Operations",
                  outcome:
                    "Build the email, SOP and CRM foundations so CEN can handle growth without depending solely on Amanda.",
                  keyApproach: [
                    "Build a 3-month email sequence, live in the CRM",
                    "Map CEN's core SOPs; write two at a time",
                    "Meet with Ben & Michael on CRM integration",
                  ].join("\n"),
                  measures: [
                    "Email sequence live, reviewed monthly",
                    "SOP template agreed; first SOPs written",
                    "CRM meeting held; actions agreed",
                  ].join("\n"),
                  month1Label: "Sequence & CRM",
                  month2Label: "SOPs Begin",
                  month3Label: "Embed & Review",
                  order: 2,
                },
              ],
            },
          },
          {
            businessName: "Amanda Askew Limited",
            theme: "BUILD",
            themeDescription:
              "This quarter is about building toward a confident pilot launch — finishing the materials, filling two pilot cohorts, and laying the foundations for a mailing list and corporate offer that will carry Amanda Askew Limited beyond this launch.",
            recommendations: [
              "Use a structured pilot feedback form: Consistent, structured feedback beats informal comments when it comes to refining the materials.",
              "Record pilot sessions (with consent): Creates reusable training assets or marketing clips for the corporate offer.",
              "Keep launch and list-building separate: The pilot launch and long-term list infrastructure are two different jobs — don't let one crowd out the other.",
              "Let pilot outcomes sell the corporate offer: Real results carry more weight with corporate buyers than a generic pitch.",
            ].join("\n"),
            order: 1,
            kpis: {
              create: [
                { name: "Pilot bookings (of 16 seats)", value: "To confirm", order: 0 },
                { name: "Mailing list growth", value: "To confirm", order: 1 },
                { name: "Corporate conversations held", value: "To confirm", order: 2 },
              ],
            },
            projects: {
              create: [
                {
                  name: "Prepare for Pilot Launch",
                  outcome:
                    "Finish all course materials to delivery standard and run a fully resourced, marketed pilot launch by late August.",
                  keyApproach: [
                    "Finish handbook, manual & scripts to delivery standard",
                    "Budget, book venue & build event planner for two cohorts",
                    "Build marketing, payment page & email sequences; launch in August",
                  ].join("\n"),
                  measures: [
                    "Materials finalised to delivery standard",
                    "Venue secured; budget signed off",
                    "Offer launched; both cohorts booked",
                  ].join("\n"),
                  month1Label: "Finish the Materials",
                  month2Label: "Launch & Fill the Pilot",
                  month3Label: "Deliver & Debrief",
                  order: 0,
                },
                {
                  name: "Build the Long-Term Mailing List",
                  outcome:
                    "Build the infrastructure and strategy to keep growing the mailing list well beyond the pilot launch.",
                  keyApproach: [
                    "Define subscriber profile; build an evergreen lead magnet",
                    "Build an always-on 52-week nurture sequence, segmented",
                    "Identify ongoing lead sources beyond the pilot",
                  ].join("\n"),
                  measures: [
                    "Lead magnet & landing page live",
                    "Always-on sequence built and segmented",
                    "Monthly tracking of growth & conversion",
                  ].join("\n"),
                  month1Label: "Early Groundwork",
                  month2Label: "Build Foundations",
                  month3Label: "Nurture & Grow",
                  order: 1,
                },
                {
                  name: 'Develop Corporate ("En Masse") Training Offer',
                  outcome:
                    "Package and market a corporate training offer to public and private sector organisations.",
                  keyApproach: [
                    "Define the offer, pricing & target organisations",
                    "Build outreach materials, landing page & email sequence",
                    "Begin outreach; follow up and review interest",
                  ].join("\n"),
                  measures: [
                    "Offer defined; target list built",
                    "Outreach materials & landing page live",
                    "Outreach underway; tracker in place",
                  ].join("\n"),
                  month1Label: "Define & Target",
                  month2Label: "Build Assets",
                  month3Label: "Outreach & Follow-up",
                  order: 2,
                },
              ],
            },
          },
          {
            businessName: "Specialist Clean & Care (SCC)",
            theme: "GROWTH",
            themeDescription:
              "This quarter is about building real momentum for Specialist Clean & Care — a disciplined approach to winning new contracts, and getting the name out there properly through content, campaigns and local partnerships.",
            recommendations: [
              "Score prospects before chasing them: A simple ideal-client scorecard (size, sector fit, logistics) keeps the target list disciplined.",
              "Make testimonials standard practice: Ask every satisfied contract client for a testimonial, not just as a one-off ask.",
              "Keep campaigns distinctly themed: Summer and September campaigns should feel different, not blur into one message.",
              "Hold off research until it's scoped: Better to wait and scope it properly with Ben than research the wrong thing.",
            ].join("\n"),
            order: 2,
            kpis: {
              create: [
                { name: "New contracts won", value: "To confirm", order: 0 },
                { name: "Proposals sent", value: "To confirm", order: 1 },
                { name: "Testimonials collected", value: "To confirm", order: 2 },
              ],
            },
            projects: {
              create: [
                {
                  name: "Win New Contracts",
                  outcome:
                    "Build a disciplined new-business engine — clear targeting, a lead-capture landing page, consistent outreach, and a formal testimonial process.",
                  keyApproach: [
                    "Define target client profiles, areas & a target list",
                    "Build a lead-capture landing page & email sequence",
                    "Run a testimonial survey; approach & follow up prospects",
                  ].join("\n"),
                  measures: [
                    "Target list & landing page live",
                    "Testimonial survey sent and reviewed",
                    "Weekly outreach on track; contracts tracked",
                  ].join("\n"),
                  month1Label: "Target & Build",
                  month2Label: "Approach & Capture Proof",
                  month3Label: "Convert & Review",
                  order: 0,
                },
                {
                  name: "Get the Name Out There (Marketing)",
                  outcome:
                    "Build visibility and credibility through consistent content, seasonal campaigns, local partnerships and directory presence.",
                  keyApproach: [
                    "Confirm messaging; optimise Google Business Profile",
                    "Build a case-study content pipeline, published monthly",
                    "Run a summer campaign, then a September campaign",
                  ].join("\n"),
                  measures: [
                    "Messaging & profile optimised",
                    "Content pipeline running monthly",
                    "Both campaigns launched; reviewed monthly",
                  ].join("\n"),
                  month1Label: "Foundations",
                  month2Label: "Summer Campaign",
                  month3Label: "September Campaign & Partnerships",
                  order: 1,
                },
                {
                  name: "Research",
                  outcome:
                    "To be discussed in detail to discover what Amanda wants to achieve from the market research, before any tasks are set.",
                  keyApproach: ["Paused until scope is agreed directly with Ben"].join("\n"),
                  measures: ["Scope agreed with Ben", "Research questions confirmed"].join("\n"),
                  month1Label: "On Hold",
                  month2Label: "On Hold",
                  month3Label: "Scope With Ben",
                  order: 2,
                },
              ],
            },
          },
          {
            businessName: "Clean & Care (CC)",
            theme: "GROWTH",
            themeDescription:
              "This quarter is about growing Clean & Care thoughtfully — strong seasonal offers, a stronger staffing and training foundation, and space to properly evaluate new opportunities without losing focus on what's already working.",
            recommendations: [
              "Reward, don't discount: Add services for existing customers rather than discounting work already delivered — protects margin, still feels like a treat.",
              "Brief staff before every launch: Every offer should be communicated clearly to delivery staff so the customer experience matches what's promised.",
              "Let the SWOT shape training: Use the staff SWOT results directly to build the training plan, rather than generic sessions.",
              "Keep new opportunities in explore mode: The goal this quarter is a decision, not a launch.",
            ].join("\n"),
            order: 3,
            kpis: {
              create: [
                { name: "Summer offer uptake", value: "To confirm", order: 0 },
                { name: "Staff SWOT completed", value: "To confirm", order: 1 },
                { name: "Leadership decision made", value: "To confirm", order: 2 },
              ],
            },
            projects: {
              create: [
                {
                  name: "Summer, Autumn & Winter Offers",
                  outcome:
                    "Launch a fully marketed summer offer, prepare and launch an autumn offer, and outline a winter offer.",
                  keyApproach: [
                    "Confirm summer offer structure, pricing & marketing plan",
                    "Launch summer offer; brief staff & track uptake",
                    "Draft & launch autumn offer; outline winter offer",
                  ].join("\n"),
                  measures: [
                    "Summer offer launched and reviewed",
                    "Autumn offer launched",
                    "Winter offer outlined",
                  ].join("\n"),
                  month1Label: "Build & Launch Summer",
                  month2Label: "Review Summer, Build Autumn",
                  month3Label: "Launch Autumn, Outline Winter",
                  order: 0,
                },
                {
                  name: "Staff",
                  outcome:
                    "Strengthen staffing, training and leadership foundations to support the established business while new ventures are built.",
                  keyApproach: [
                    "Review staffing; run a capacity check against offers",
                    "Run a staff SWOT; build a training plan",
                    "Map a leadership layer; set up staff briefings",
                  ].join("\n"),
                  measures: [
                    "Staffing review & capacity check complete",
                    "SWOT complete; training plan built",
                    "Leadership approach decided; briefings running",
                  ].join("\n"),
                  month1Label: "Review & Assess",
                  month2Label: "Train & Structure",
                  month3Label: "Implement & Review",
                  order: 1,
                },
                {
                  name: "New Opportunities",
                  outcome: "To be reviewed in mid-August, with detailed steps built out from there.",
                  keyApproach: ["Paused until reviewed with Ben in mid-August"].join("\n"),
                  measures: ["Opportunities reviewed with Ben", "Next steps agreed (if any)"].join(
                    "\n"
                  ),
                  month1Label: "On Hold",
                  month2Label: "Review With Ben",
                  month3Label: "Decide",
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Loaded Q3 2026 plan for ${amanda.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
