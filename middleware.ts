import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/admin", "/api/admin", "/account", "/profile", "/dashboard", "/panel"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  if (!panelAuthEnabled()) {
    return NextResponse.next();
  }

  const username = process.env.PANEL_AUTH_USER;
  const password = process.env.PANEL_AUTH_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Panel auth is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const authorized = isAuthorized(request.headers.get("authorization"), username, password);
  if (!authorized) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Serenza Home Living Panel"',
        "Cache-Control": "no-store"
      }
    });
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/profile/:path*", "/dashboard/:path*", "/panel/:path*"]
};

function panelAuthEnabled() {
  if (process.env.PANEL_AUTH_ENABLED === "false") return false;
  if (process.env.PANEL_AUTH_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

function isAuthorized(header: string | null, username: string, password: string) {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = decodeBasicAuth(header);
  if (!decoded) return false;
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  return safeEqual(decoded.slice(0, separator), username) && safeEqual(decoded.slice(separator + 1), password);
}

function decodeBasicAuth(header: string) {
  try {
    return atob(header.slice("Basic ".length));
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
