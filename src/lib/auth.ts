import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit } from "./rateLimit";

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
      async authorize(credentials) {
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
        // The org this account actually belongs to — never changes,
        // regardless of which org a SUPERADMIN is currently viewing.
        token.realOrganizationId = (user as any).organizationId;
      }

      // Only a SUPERADMIN's own token can ever have its effective org
      // swapped — this check runs against the token's original role,
      // which is never itself changed by impersonation, so a regular
      // admin can never trigger this branch no matter what they send.
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
