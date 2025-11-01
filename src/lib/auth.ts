import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { users, stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// In-memory revoked session tokens (resets on server restart)
// For production, consider using Redis or database table
const revokedTokens = new Set<string>();

// Helper function to revoke a token (call this on logout)
export function revokeToken(jti: string) {
  revokedTokens.add(jti);
}

// Helper function to check if a token is revoked
export function isTokenRevoked(jti: string): boolean {
  return revokedTokens.has(jti);
}

// Custom error class for revoked tokens
export class SessionRevokedError extends Error {
  constructor(
    message = "Your session has been terminated for security reasons",
  ) {
    super(message);
    this.name = "SessionRevokedError";
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
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

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
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
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, trigger, user, session }) {
      // Check if token is revoked on every request
      if (token.jti && typeof token.jti === "string") {
        if (revokedTokens.has(token.jti)) {
          // Token is revoked, throw a more descriptive error
          throw new SessionRevokedError("Session token has been revoked");
        }
      }
      if (user) {
        token.sub = user.id;
        // Generate unique JWT ID (jti) to prevent session token reuse
        token.jti = `${user.id}-${Date.now()}-${crypto.randomUUID()}`;

        // Check if user has an existing store on first login
        if (!token.storeId) {
          const existingStore = await db
            .select()
            .from(stores)
            .where(eq(stores.ownerId, user.id))
            .limit(1);

          if (existingStore.length > 0) {
            token.storeId = existingStore[0].id;
          }
        }
      }
      // When the client calls session.update({ store: { id } }), persist to JWT
      if (trigger === "update") {
        const updated = session as { store?: { id?: string } } | undefined;
        if (updated?.store?.id) {
          token.storeId = updated.store.id;
        }
      }
      return token;
    },
    async signIn({ user: _user, account, profile }) {
      // If user signs in with Google and doesn't exist in our users table, create them
      if (account?.provider === "google" && profile?.email) {
        const username = profile.email.split("@")[0];
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, username));

        if (existingUser.length === 0) {
          // Create new user with Google info
          await db.insert(users).values({
            id: crypto.randomUUID(),
            username,
            password: "", // OAuth users don't need password
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Prefer values from token to avoid extra DB hits
      if (session.user) {
        session.user.id = token.sub!;
      }
      if (token.storeId) {
        session.store = { id: token.storeId };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
