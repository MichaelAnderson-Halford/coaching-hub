import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit } from "./rateLimit";
import { resolveOrgFromHost } from "./tenant";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const allowed = await checkRateLimit(`login:${normalizedEmail}`, 10, 15);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Enforce tenant isolation by subdomain/custom domain: a
        // SUPERADMIN can sign in from anywhere (they need cross-org
        // access), but a regular user can only sign in from their own
        // organization's subdomain or custom domain, or from the bare
        // base domain (no specific tenant resolved).
        if (user.role !== "SUPERADMIN") {
          const hostHeader = req?.headers?.host as string | undefined;
          const hostOrg = await resolveOrgFromHost(hostHeader || null);
          if (hostOrg && hostOrg.id !== user.organizationId) {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.realOrganizationId = (user as any).organizationId;
      }

      if (trigger === "update" && token.role === "SUPERADMIN") {
        if (session?.viewOrgId) {
          token.organizationId = session.viewOrgId;
        }
        if (session?.exitImpersonation) {
          token.organizationId = token.realOrganizationId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).realOrganizationId = token.realOrganizationId;
        (session.user as any).isImpersonating =
          token.organizationId !== token.realOrganizationId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
