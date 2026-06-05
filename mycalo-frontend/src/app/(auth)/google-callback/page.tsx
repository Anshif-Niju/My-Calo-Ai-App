import GoogleCallbackHandler from "@/components/auth/GoogleCallbackHandler";
import { Suspense } from "react";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
