import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "nexusgpu_session";

/** RF-U2: redirect optimista; AppShell y los servicios verifican la sesión y el rol. */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
