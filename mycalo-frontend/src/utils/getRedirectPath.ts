export const getRedirectPath = (user: any) => {
  if (!user) return "/login";

  // Admins

  if (user.role === "admin") {
    return "/admin/dashboard";
  }

  if (user.role === "subadmin") {
    return "/subadmin/dashboard";
  }

  // Normal User

  if (user.role === "user") {
    
    if (!user.onboardingCompleted) {
      return "/onboarding/user";
    }
    if (!user.hasSubmittedVerification) {
      return "/onboarding/user/profile";
    }

    return "/home";
  }

  // Doctor

  if (user.role === "doctor") {
    if (!user.onboardingCompleted) {
      return "/onboarding/doctor";
    }

    if (!user.hasSubmittedVerification) {
      return "/onboarding/doctor/profile";
    }

    switch (user.verificationStatus) {
      case "approved":
        return "/doctor/dashboard";

      case "pending":
      case "under_review":
        return "/onboarding/doctor/verification";

      case "rejected":
      case "not_submitted":
      default:
        return "/onboarding/doctor/profile";
    }
  }

  return "/login";
};
