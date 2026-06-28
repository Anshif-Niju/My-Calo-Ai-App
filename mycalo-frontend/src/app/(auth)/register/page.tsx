import React from "react";
import AuthContainer from "@/components/auth/AuthContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | MyCalo AI",
  description: "Join MyCalo AI and start your personalized health journey.",
};

export default function RegisterPage() {
  return <AuthContainer initialMode="register" />;
}

