import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Route categories ──────────────────────────────────────────────────────────

const GUEST_ONLY_PATHS = ["/", "/login", "/register", "/forgot-password", "/new-password", "/verify-email", "/verify-reset-otp", "/two-factor", "/google-callback"];

const USER_PATHS = ["/home", "/ai", "/doctors", "/settings"];
const DOCTOR_PATHS = ["/doctor"];
const ADMIN_PATHS = ["/admin"];
const SUBADMIN_PATHS = ["/subadmin"];

// ── Helper: compute correct destination for a given user payload ──────────────
function getCorrectPath(payload: any): string {
  const { role, onboardingCompleted, hasSubmittedVerification, verificationStatus } = payload;

  if (role === "admin") return "/admin/dashboard";
  if (role === "subadmin") return "/subadmin/dashboard";

  if (role === "user") {
    if (!onboardingCompleted) return "/onboarding/user";
    if (!hasSubmittedVerification) return "/onboarding/user/profile";
    return "/home";
  }

  if (role === "doctor") {
    if (!onboardingCompleted) return "/onboarding/doctor";
    if (!hasSubmittedVerification) return "/onboarding/doctor/profile";
    if (verificationStatus === "approved") return "/doctor/dashboard";
    if (verificationStatus === "pending" || verificationStatus === "under_review") return "/onboarding/doctor/verification";
    return "/onboarding/doctor/profile";
  }

  return "/login";
}

// ── Helper: check if the current path is the right one for this user ──────────
function isOnCorrectPath(pathname: string, correctPath: string): boolean {
  const norm = (p: string) => p.replace(/\/$/, "");
  const current = norm(pathname);
  const correct = norm(correctPath);

  // If they are exactly on the right page — OK
  if (current === correct) return true;

  const correctIsHome = correct === "/home";
  const correctIsDoctorDash = correct === "/doctor/dashboard";

  if (correctIsHome && (current.startsWith("/home") || USER_PATHS.some((p) => current.startsWith(p)))) {
    return true;
  }

  if (correctIsDoctorDash && DOCTOR_PATHS.some((p) => current.startsWith(p))) {
    return true;
  }

  if (correct.startsWith("/admin") && current.startsWith("/admin")) return true;
  if (correct.startsWith("/subadmin") && current.startsWith("/subadmin")) return true;

  return false;
}

// ── Middleware ─────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGuestPath = GUEST_ONLY_PATHS.some((p) => pathname === p) || pathname.startsWith("/(auth)");
  const isProtectedPath =
    USER_PATHS.some((p) => pathname.startsWith(p)) ||
    DOCTOR_PATHS.some((p) => pathname.startsWith(p)) ||
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) ||
    SUBADMIN_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/onboarding");

  // If not a route we care about, skip
  if (!isGuestPath && !isProtectedPath) {
    return NextResponse.next();
  }

  // ── Decode the JWT from cookie ──────────────────────────────────────────────
  const token = request.cookies.get("accessToken")?.value;
  let payload: any = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      // Token invalid or expired — treat as logged-out
      payload = null;
    }
  }

  const isLoggedIn = payload !== null;

  // ── Guest-only pages: redirect logged-in users away ────────────────────────
  if (isGuestPath && isLoggedIn) {
    const correctPath = getCorrectPath(payload);
    return NextResponse.redirect(new URL(correctPath, request.url));
  }

  // ── Protected pages: redirect guests to login ──────────────────────────────
  if (isProtectedPath && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Protected pages: logged-in user on wrong step → redirect ───────────────
  if (isProtectedPath && isLoggedIn) {
    const correctPath = getCorrectPath(payload);

    if (!isOnCorrectPath(pathname, correctPath)) {
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
  }

  return NextResponse.next();
}

// ── Matcher: which paths does middleware run on ───────────────────────────────
export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
