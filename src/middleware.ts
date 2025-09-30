import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth(async function middleware(req: NextRequest) {
  const session = req.auth;
  const pathname = req.nextUrl.pathname;

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      // Redirect to sign in if not authenticated
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    
    // Check if user has admin privileges
    const user = session.user as any;
    if (user.userType !== "admin") {
      // Redirect to unauthorized page if not admin
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Account routes protection
  if (pathname.startsWith("/account")) {
    if (!session?.user) {
      // Redirect to sign in if not authenticated
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = { 
  matcher: ["/account(.*)", "/admin(.*)"] 
};
