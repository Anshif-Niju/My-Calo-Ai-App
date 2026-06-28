import React from "react";
import AuthContainer from "@/components/auth/AuthContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | MyCalo AI",
  description: "Log in to your personalized health assistant.",
};

export default function LoginPage() {
  return <AuthContainer initialMode="login" />;
}

