import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const pathname = request.nextUrl.pathname;

  // If user is logged in and must change password, redirect to change-password page
  // except if they're already on that page or on login/logout pages
  if (
    session?.user &&
    session.user.mustChangePassword &&
    pathname !== "/change-password" &&
    !pathname.startsWith("/api/") &&
    pathname !== "/login" &&
    pathname !== "/logout"
  ) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

