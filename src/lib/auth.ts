import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Find user by username
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username as string))
          .limit(1);

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // NextAuth expects an object with at least an id
        return {
          id: user.id,
          name: user.username,
          // Provide an email-shaped value so existing callbacks that derive username from email continue to work
          email: `${user.username}@local`,
          userType: user.userType,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, persist id and userType onto the token
      if (user) {
        token.sub = user.id as string;
        if ((user as any).userType) token.userType = (user as any).userType;
      }
      return token;
    },
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
      // Prefer values from token to avoid extra DB hit on every request
      if (session.user) {
        (session.user as any).id = token.sub!;
        (session.user as any).userType = token.userType;
      }
      // Fallback: if userType missing but we have an email, try to fetch once
      if (session.user?.email && !(session.user as any).userType) {
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
});

// Legacy export for compatibility
export const authOptions = {
  providers: [],
  callbacks: {},
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
};
