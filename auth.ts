import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import {
  findOrCreateUser,
  verifyPassword,
  getUserByEmail,
} from "@/models/User";
import { getAgencyById } from "@/models/Agency";
import { sendWelcomeEmail } from "@/lib/email";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await verifyPassword(
          credentials.email as string,
          credentials.password as string
        );

        if (!user) {
          return null;
        }

        return {
          id: user._id!.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          mustChangePassword: user.mustChangePassword || false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          const { isNewUser } = await findOrCreateUser({
            email: user.email!,
            name: user.name || undefined,
            image: user.image || undefined,
            googleId: profile.sub as string,
          });

          // Send welcome email to new Google users
          if (isNewUser && user.email && user.name) {
            sendWelcomeEmail(user.email, user.name).catch((error) => {
              console.error("Failed to send welcome email:", error);
            });
          }

          return true;
        } catch (error) {
          console.error("Error creating user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user, trigger }) {
      if (account?.provider === "google" && profile) {
        token.googleId = profile.sub;
      }
      if (user) {
        token.id = user.id;
        token.mustChangePassword = (user as any).mustChangePassword || false;
        // Set email from user if not already set
        if (user.email && !token.email) {
          token.email = user.email;
        }
      }
      // Fetch role and agency info from database on initial sign in or when updating session
      // Always fetch from DB when we have email to ensure mustChangePassword is up to date
      if (token.email) {
        const dbUser = await getUserByEmail(token.email);
        if (dbUser) {
          token.role = dbUser.role || "user";
          token.mustChangePassword = dbUser.mustChangePassword || false;
          
          // If user is an agency, fetch agency status
          if (dbUser.role === "agency" && dbUser.agencyId) {
            token.agencyId = dbUser.agencyId.toString();
            const agency = await getAgencyById(dbUser.agencyId.toString());
            if (agency) {
              token.agencyStatus = agency.status;
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.googleId = token.googleId as string;
        session.user.role = (token.role as "user" | "admin" | "agency") || "user";
        session.user.agencyId = token.agencyId as string | undefined;
        session.user.agencyStatus = token.agencyStatus as "pending" | "verified" | "rejected" | "suspended" | undefined;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) || false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
