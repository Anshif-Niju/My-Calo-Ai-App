"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "doctor") {
        router.push("/doctor/dashboard");
      } else {
        router.push("/home");
      }
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  // തിരിച്ചുവിടുന്ന ആ ചെറിയ സമയത്ത് സ്ക്രീൻ വെളുപ്പിച്ചു നിർത്തുന്നു (Flicker ഒഴിവാക്കാൻ)
  if (isChecking || user) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  return <>{children}</>;
}
