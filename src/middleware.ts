import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth(async (req) => {
  const session = req.auth;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (!session?.store?.id) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (pathname.startsWith("/onboarding")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (session?.store?.id) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  runtime: "nodejs",
};
