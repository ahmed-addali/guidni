import { betterFetch } from "@better-fetch/fetch";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import type { Session } from "./lib/auth";

const intlMiddleware = createIntlMiddleware(routing);

const protectedPaths = ["/bookings", "/checkout", "/wishlist", "/profile", "/reviews"];
const dashboardPaths = ["/admin", "/partner", "/agent"];

function isProtected(pathname: string): boolean {
  return (
    protectedPaths.some((p) => pathname.includes(p)) ||
    dashboardPaths.some((p) => pathname.includes(p))
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const intlResponse = intlMiddleware(request);

  if (!isProtected(pathname)) {
    return intlResponse;
  }

  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  if (!session) {
    const locale = pathname.split("/")[1] ?? "en";
    const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)" ],
};
