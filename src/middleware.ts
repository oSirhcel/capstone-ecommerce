import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (!token) {
        // Redirect to sign in if not authenticated
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }

      if (!token.storeId) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
    if (pathname.startsWith("/onboarding")) {
      if (token?.storeId) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow access to non-protected routes
        if (
          !pathname.startsWith("/admin") &&
          !pathname.startsWith("/account")
        ) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/account(.*)", "/admin(.*)", "/onboarding(.*)"],
};
