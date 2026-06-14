import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ⚡ ടോക്കണിൽ നിന്നും റോൾ എടുക്കാനുള്ള Edge-compatible ഫംഗ്ഷൻ (Redux ആവശ്യമില്ല!)
const getRoleFromToken = (token: string) => {
  try {
    const payloadBase64 = token.split(".")[1];
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const decodedJson = atob(base64); // Edge ൽ വർക്ക് ചെയ്യുന്ന ഡീകോഡർ
    const payload = JSON.parse(decodedJson);

    return payload.role; // ഇതിൽ നിന്ന് 'doctor', 'admin', 'user' എന്നിവ കിട്ടും
  } catch (error) {
    return "user"; // എന്തെങ്കിലും എറർ വന്നാൽ ഡീഫോൾട്ട് ആയി user ആക്കാം
  }
};

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // നിന്റെ Auth പേജുകൾ കൃത്യമായി കൊടുത്തു
  const authPages = ["/login", "/register", "/forgot-password", "/new-password", "/two-factor", "/verify-email", "/verify-reset-otp", "/google-callback"];

  const isAuthPage = authPages.some((page) => request.nextUrl.pathname.startsWith(page));

  // 1. ടോക്കൺ ഇല്ലാത്തവർ ലോഗിൻ അല്ലാത്ത പേജുകളിൽ വന്നാൽ -> ലോഗിനിലേക്ക് വിടുക
  if (!accessToken && !refreshToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. ലോഗിൻ ചെയ്ത യൂസർ വീണ്ടും ലോഗിൻ/രജിസ്റ്റർ പേജിൽ വന്നാൽ -> റോൾ അനുസരിച്ച് ഡാഷ്‌ബോർഡിലേക്ക് തള്ളുക
  if ((accessToken || refreshToken) && isAuthPage) {
    let role = "user"; // ഡീഫോൾട്ട്

    // ടോക്കൺ ഉണ്ടെങ്കിൽ അതിൽ നിന്നും റോൾ എടുക്കുന്നു (Redux വേണ്ട!)
    if (accessToken) {
      role = getRoleFromToken(accessToken);
    }

    // 🚀 റോൾ അനുസരിച്ച് കൃത്യമായ ഡാഷ്‌ബോർഡിലേക്ക് വിടുന്നു
    let redirectPath = "/home";

    switch (role) {
      case "admin":
        redirectPath = "/admin/dashboard";
        break;
      case "subadmin":
        redirectPath = "/subadmin/dashboard";
        break;
      case "doctor":
        redirectPath = "/doctor/dashboard";
        break;
      case "user":
      default:
        redirectPath = "/home";
        break;
    }

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 3. കുഴപ്പമൊന്നുമില്ലെങ്കിൽ പേജ് കാണിക്കാൻ അനുവദിക്കുക
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
