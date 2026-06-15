import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const publicPages = ["/", "/login", "/register", "/forgot-password", "/new-password", "/verify-email", "/verify-reset-otp", "/two-factor", "/google-callback"];

  const isPublicPage = publicPages.some((page) => request.nextUrl.pathname === page || request.nextUrl.pathname.startsWith(`${page}/`));
  if (!accessToken && !refreshToken && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((accessToken || refreshToken) && isPublicPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. കുഴപ്പമൊന്നുമില്ലെങ്കിൽ പേജ് കാണിക്കുക
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
