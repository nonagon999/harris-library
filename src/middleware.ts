import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { updateSession } from "@/utils/supabase/middleware";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hmc-library-dev-secret-change-in-production"
);
const COOKIE_NAME = "hmc_library_session";

const publicPaths = ["/", "/opac", "/login"];
const publicPrefixes = ["/opac/", "/api/opac/", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  // Keep Supabase auth session refreshed (for @supabase/ssr clients)
  let response: NextResponse;
  try {
    response = await updateSession(request);
  } catch (error) {
    console.error("[middleware] Supabase session refresh failed:", error);
    response = NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;

  const isPublic =
    publicPaths.includes(pathname) ||
    publicPrefixes.some((p) => pathname.startsWith(p));

  if (isPublic) return response;

  // Librarian portal uses custom JWT auth (separate from Supabase Auth)
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return response;
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all routes except static files and images.
     * Supabase session refresh runs on matched routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
