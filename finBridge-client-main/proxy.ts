import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value || "";
  const userRole = request.cookies.get("user-role")?.value || "";
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/entrepreneur") || pathname.startsWith("/mfi") || pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based authorization
    const role = userRole.toLowerCase();
    if (pathname.startsWith("/entrepreneur") && role !== "entrepreneur") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (pathname.startsWith("/mfi") && role !== "mfi_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (pathname.startsWith("/admin") && role !== "platform_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/entrepreneur/:path*", "/mfi/:path*", "/admin/:path*"],
};
