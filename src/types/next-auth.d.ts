import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType: "customer" | "owner" | "admin";
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    userType: "customer" | "owner" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: "customer" | "owner" | "admin";
  }
}
