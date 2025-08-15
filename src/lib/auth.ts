import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // If user signs in with Google and doesn't exist in our users table, create them
      if (account?.provider === "google" && profile?.email) {
        const username = profile.email.split('@')[0];
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, username));
        
        if (existingUser.length === 0) {
          // Create new user with Google info
          await db.insert(users).values({
            id: randomUUID(),
            username,
            password: '', // OAuth users don't need password
            userType: "customer",
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        // Get user from database to include userType
        const username = session.user.email.split('@')[0];
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username));
        
        if (user) {
          (session.user as any).id = user.id;
          (session.user as any).userType = user.userType;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
