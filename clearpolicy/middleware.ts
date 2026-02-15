import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

function hasValidClerkKeys(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  const validPk =
    typeof pk === "string" &&
    pk.length > 0 &&
    !pk.startsWith("YOUR_");
  const validSk =
    typeof sk === "string" &&
    sk.length > 0 &&
    !sk.startsWith("YOUR_");
  return validPk && validSk;
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  try {
    if (!hasValidClerkKeys()) return NextResponse.next();
    const { clerkMiddleware, createRouteMatcher } = await import(
      "@clerk/nextjs/server"
    );
    // Only protect routes that require user-specific data
    // Browse, Compare, Search, and Measure are public so new users can explore
    const isProtectedRoute = createRouteMatcher([
      "/history(.*)",
      "/explore(.*)",
      "/settings(.*)",
      "/admin(.*)",
    ]);
    return await clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        const { userId } = await auth();
        if (!userId) {
          const signUpUrl = new URL("/sign-up", request.url);
          signUpUrl.searchParams.set(
            "redirect_url",
            request.nextUrl.pathname + request.nextUrl.search
          );
          return NextResponse.redirect(signUpUrl);
        }
      }
    })(req, event);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
